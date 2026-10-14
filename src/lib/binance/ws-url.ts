import { BINANCE_WS_BASE } from './constants'
import type { KlineInterval } from './types'

export function buildCombinedStreamUrl(streams: string[]): string {
  const normalized = streams.map((s) => s.toLowerCase()).join('/')
  return `${BINANCE_WS_BASE}/stream?streams=${normalized}`
}

export function tickerStream(symbol: string): string {
  return `${symbol.toLowerCase()}@ticker`
}

export function tradeStream(symbol: string): string {
  return `${symbol.toLowerCase()}@trade`
}

export function klineStream(symbol: string, interval: KlineInterval): string {
  return `${symbol.toLowerCase()}@kline_${interval}`
}

export function depthStream(symbol: string, speed: '100ms' | '1000ms' = '100ms'): string {
  return `${symbol.toLowerCase()}@depth@${speed}`
}
