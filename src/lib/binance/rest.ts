import { BINANCE_REST_BASE } from './constants'
import type { Candle, DepthLevel, KlineInterval, OrderBookSnapshot, Ticker24h } from './types'

async function getJson<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(path, BINANCE_REST_BASE)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Binance REST ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

function parseLevels(rows: [string, string][]): DepthLevel[] {
  return rows.map(([price, qty]) => ({
    price: Number(price),
    qty: Number(qty),
  }))
}

export async function fetchTicker24h(symbol: string): Promise<Ticker24h> {
  const raw = await getJson<{
    symbol: string
    lastPrice: string
    priceChangePercent: string
    volume: string
    quoteVolume: string
    highPrice: string
    lowPrice: string
  }>('/api/v3/ticker/24hr', { symbol })

  return {
    symbol: raw.symbol,
    lastPrice: Number(raw.lastPrice),
    priceChangePercent: Number(raw.priceChangePercent),
    volume: Number(raw.volume),
    quoteVolume: Number(raw.quoteVolume),
    highPrice: Number(raw.highPrice),
    lowPrice: Number(raw.lowPrice),
  }
}

export async function fetchTickers24h(symbols: string[]): Promise<Ticker24h[]> {
  const raw = await getJson<
    Array<{
      symbol: string
      lastPrice: string
      priceChangePercent: string
      volume: string
      quoteVolume: string
      highPrice: string
      lowPrice: string
    }>
  >('/api/v3/ticker/24hr', { symbols: JSON.stringify(symbols) })

  return raw.map((item) => ({
    symbol: item.symbol,
    lastPrice: Number(item.lastPrice),
    priceChangePercent: Number(item.priceChangePercent),
    volume: Number(item.volume),
    quoteVolume: Number(item.quoteVolume),
    highPrice: Number(item.highPrice),
    lowPrice: Number(item.lowPrice),
  }))
}

export async function fetchKlines(
  symbol: string,
  interval: KlineInterval,
  limit = 200,
): Promise<Candle[]> {
  const raw = await getJson<Array<[number, string, string, string, string, string]>>(
    '/api/v3/klines',
    { symbol, interval, limit },
  )

  return raw.map((row) => ({
    time: Math.floor(row[0] / 1000),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  }))
}

export async function fetchDepth(symbol: string, limit = 100): Promise<OrderBookSnapshot> {
  const raw = await getJson<{
    lastUpdateId: number
    bids: [string, string][]
    asks: [string, string][]
  }>('/api/v3/depth', { symbol, limit })

  return {
    lastUpdateId: raw.lastUpdateId,
    bids: parseLevels(raw.bids),
    asks: parseLevels(raw.asks),
  }
}
