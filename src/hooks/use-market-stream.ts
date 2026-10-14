import { useEffect, useRef } from 'react'
import {
  applyDepthUpdate,
  createEmptyBook,
  parseDepthUpdate,
  shouldApplyUpdate,
  snapshotToBook,
  sortedAsks,
  sortedBids,
  type LocalOrderBook,
} from '@/lib/binance/orderbook'
import { ORDER_BOOK_LEVELS, STALE_MS } from '@/lib/binance/constants'
import { fetchDepth } from '@/lib/binance/rest'
import type {
  Candle,
  Ticker24h,
  Trade,
  WsDepthPayload,
  WsKlinePayload,
  WsTickerPayload,
  WsTradePayload,
} from '@/lib/binance/types'
import { depthStream, klineStream, tickerStream, tradeStream } from '@/lib/binance/ws-url'
import { getWebSocketManager, type RawStreamMessage } from '@/lib/ws/manager'
import { useMarketStore } from '@/stores/market-store'

function toTicker(payload: WsTickerPayload): Ticker24h {
  return {
    symbol: payload.s,
    lastPrice: Number(payload.c),
    priceChangePercent: Number(payload.P),
    volume: Number(payload.v),
    quoteVolume: Number(payload.q),
    highPrice: Number(payload.h),
    lowPrice: Number(payload.l),
  }
}

function toTrade(payload: WsTradePayload): Trade {
  return {
    id: payload.t,
    symbol: payload.s,
    price: Number(payload.p),
    qty: Number(payload.q),
    time: payload.T,
    isBuyerMaker: payload.m,
  }
}

function toCandle(payload: WsKlinePayload): Candle {
  return {
    time: Math.floor(payload.k.t / 1000),
    open: Number(payload.k.o),
    high: Number(payload.k.h),
    low: Number(payload.k.l),
    close: Number(payload.k.c),
    volume: Number(payload.k.v),
  }
}

export function useMarketStream() {
  const watchlist = useMarketStore((s) => s.watchlist)
  const activeSymbol = useMarketStore((s) => s.activeSymbol)
  const interval = useMarketStore((s) => s.interval)
  const setConnectionStatus = useMarketStore((s) => s.setConnectionStatus)
  const upsertTicker = useMarketStore((s) => s.upsertTicker)
  const pushTrades = useMarketStore((s) => s.pushTrades)
  const ingestFlow = useMarketStore((s) => s.ingestFlow)
  const setLiveCandle = useMarketStore((s) => s.setLiveCandle)
  const setOrderBook = useMarketStore((s) => s.setOrderBook)
  const setMetrics = useMarketStore((s) => s.setMetrics)

  const bookRef = useRef<LocalOrderBook>(createEmptyBook())
  const firstAfterSnapshotRef = useRef(true)
  const bufferingRef = useRef(true)
  const bufferRef = useRef<ReturnType<typeof parseDepthUpdate>[]>([])
  const syncingRef = useRef(false)

  useEffect(() => {
    const manager = getWebSocketManager()

    const streams = [
      ...watchlist.map((symbol) => tickerStream(symbol)),
      tradeStream(activeSymbol),
      klineStream(activeSymbol, interval),
      depthStream(activeSymbol),
    ]

    manager.setStreams(streams)

    const unsubStatus = manager.onStatus(setConnectionStatus)
    const unsubMetrics = manager.onMetrics(setMetrics)

    return () => {
      unsubStatus()
      unsubMetrics()
    }
  }, [
    watchlist,
    activeSymbol,
    interval,
    setConnectionStatus,
    setMetrics,
  ])

  useEffect(() => {
    let cancelled = false
    const manager = getWebSocketManager()

    bookRef.current = createEmptyBook()
    firstAfterSnapshotRef.current = true
    bufferingRef.current = true
    bufferRef.current = []
    setOrderBook([], [])

    async function syncOrderBook() {
      if (syncingRef.current) return
      syncingRef.current = true
      bufferingRef.current = true
      bufferRef.current = []
      firstAfterSnapshotRef.current = true

      try {
        const snapshot = await fetchDepth(activeSymbol, 100)
        if (cancelled) return

        bookRef.current = snapshotToBook(snapshot)

        const pending = bufferRef.current
        bufferRef.current = []
        for (const update of pending) {
          const decision = shouldApplyUpdate(
            bookRef.current,
            update,
            firstAfterSnapshotRef.current,
          )
          if (decision === 'skip') continue
          if (decision === 'resync') {
            syncingRef.current = false
            void syncOrderBook()
            return
          }
          applyDepthUpdate(bookRef.current, update)
          firstAfterSnapshotRef.current = false
        }

        bufferingRef.current = false
        setOrderBook(
          sortedBids(bookRef.current, ORDER_BOOK_LEVELS),
          sortedAsks(bookRef.current, ORDER_BOOK_LEVELS),
        )
      } catch {
        // retry on next depth event / reconnect
      } finally {
        syncingRef.current = false
      }
    }

    void syncOrderBook()

    const unsub = manager.onMessages((messages: RawStreamMessage[]) => {
      const trades: Trade[] = []
      let bookDirty = false

      for (const message of messages) {
        const data = message.data as { e?: string }

        if (data.e === '24hrTicker') {
          upsertTicker(toTicker(data as WsTickerPayload))
          continue
        }

        if (data.e === 'trade') {
          const trade = toTrade(data as WsTradePayload)
          if (trade.symbol === activeSymbol) trades.push(trade)
          continue
        }

        if (data.e === 'kline') {
          const payload = data as WsKlinePayload
          if (payload.s === activeSymbol) setLiveCandle(toCandle(payload))
          continue
        }

        if (data.e === 'depthUpdate') {
          const update = parseDepthUpdate(data as WsDepthPayload)
          if (update.symbol !== activeSymbol) continue

          if (bufferingRef.current) {
            bufferRef.current.push(update)
            continue
          }

          const decision = shouldApplyUpdate(
            bookRef.current,
            update,
            firstAfterSnapshotRef.current,
          )

          if (decision === 'skip') continue
          if (decision === 'resync') {
            void syncOrderBook()
            continue
          }

          applyDepthUpdate(bookRef.current, update)
          firstAfterSnapshotRef.current = false
          bookDirty = true
        }
      }

      if (trades.length > 0) {
        ingestFlow(trades)
        pushTrades([...trades].reverse())
      }

      if (bookDirty) {
        setOrderBook(
          sortedBids(bookRef.current, ORDER_BOOK_LEVELS),
          sortedAsks(bookRef.current, ORDER_BOOK_LEVELS),
        )
      }
    })

    const staleTimer = window.setInterval(() => {
      const metrics = manager.getMetrics()
      if (
        metrics.lastMessageAt &&
        Date.now() - metrics.lastMessageAt > STALE_MS &&
        manager.getStatus() === 'live'
      ) {
        setConnectionStatus('reconnecting')
      }
    }, 2000)

    return () => {
      cancelled = true
      unsub()
      window.clearInterval(staleTimer)
    }
  }, [
    activeSymbol,
    upsertTicker,
    pushTrades,
    ingestFlow,
    setLiveCandle,
    setOrderBook,
    setConnectionStatus,
  ])
}
