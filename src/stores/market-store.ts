import { create } from 'zustand'
import { DEFAULT_WATCHLIST, MAX_TRADES } from '@/lib/binance/constants'
import type {
  Candle,
  ConnectionStatus,
  DepthLevel,
  FlowBucket,
  KlineInterval,
  Ticker24h,
  Trade,
} from '@/lib/binance/types'
import type { StreamMetrics } from '@/lib/ws/manager'

interface MarketState {
  watchlist: string[]
  activeSymbol: string
  interval: KlineInterval
  connectionStatus: ConnectionStatus
  tickers: Record<string, Ticker24h>
  trades: Trade[]
  liveCandle: Candle | null
  bids: DepthLevel[]
  asks: DepthLevel[]
  flow: FlowBucket[]
  cvd: number
  metrics: StreamMetrics
  labEventsPerSecond: number
  labRunning: boolean

  setActiveSymbol: (symbol: string) => void
  setInterval: (interval: KlineInterval) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  upsertTicker: (ticker: Ticker24h) => void
  upsertTickers: (tickers: Ticker24h[]) => void
  pushTrades: (trades: Trade[]) => void
  setLiveCandle: (candle: Candle | null) => void
  setOrderBook: (bids: DepthLevel[], asks: DepthLevel[]) => void
  ingestFlow: (trades: Trade[]) => void
  setMetrics: (metrics: StreamMetrics) => void
  setLabEventsPerSecond: (value: number) => void
  setLabRunning: (running: boolean) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  watchlist: [...DEFAULT_WATCHLIST],
  activeSymbol: 'BTCUSDT',
  interval: '5m',
  connectionStatus: 'offline',
  tickers: {},
  trades: [],
  liveCandle: null,
  bids: [],
  asks: [],
  flow: [],
  cvd: 0,
  metrics: {
    eventsReceived: 0,
    eventsDropped: 0,
    uiUpdates: 0,
    lastMessageAt: null,
    latencyMs: null,
    uiUpdateHz: 0,
    eventsPerSecond: 0,
  },
  labEventsPerSecond: 0,
  labRunning: false,

  setActiveSymbol: (symbol) =>
    set({
      activeSymbol: symbol,
      trades: [],
      liveCandle: null,
      bids: [],
      asks: [],
      flow: [],
      cvd: 0,
    }),
  setInterval: (interval) => set({ interval, liveCandle: null }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  upsertTicker: (ticker) =>
    set((state) => ({
      tickers: { ...state.tickers, [ticker.symbol]: ticker },
    })),
  upsertTickers: (tickers) =>
    set((state) => {
      const next = { ...state.tickers }
      for (const ticker of tickers) next[ticker.symbol] = ticker
      return { tickers: next }
    }),
  pushTrades: (incoming) =>
    set((state) => {
      if (incoming.length === 0) return state
      const merged = [...incoming, ...state.trades]
      return { trades: merged.slice(0, MAX_TRADES) }
    }),
  setLiveCandle: (liveCandle) => set({ liveCandle }),
  setOrderBook: (bids, asks) => set({ bids, asks }),
  ingestFlow: (incoming) =>
    set((state) => {
      if (incoming.length === 0) return state
      const buckets = state.flow.map((bucket) => ({ ...bucket }))
      let cvd = state.cvd

      for (const trade of incoming) {
        const start = Math.floor(trade.time / 2_000) * 2_000
        let bucket = buckets.at(-1)
        if (!bucket || bucket.start !== start) {
          bucket = { start, buy: 0, sell: 0, close: trade.price }
          buckets.push(bucket)
        }
        const notional = trade.price * trade.qty
        if (trade.isBuyerMaker) bucket.sell += notional
        else bucket.buy += notional
        bucket.close = trade.price
        cvd += trade.isBuyerMaker ? -notional : notional
      }

      return { flow: buckets.slice(-60), cvd }
    }),
  setMetrics: (metrics) => set({ metrics }),
  setLabEventsPerSecond: (labEventsPerSecond) => set({ labEventsPerSecond }),
  setLabRunning: (labRunning) => set({ labRunning }),
}))
