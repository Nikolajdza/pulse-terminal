import { useQuery } from '@tanstack/react-query'
import { fetchDepth, fetchKlines, fetchTickers24h } from '@/lib/binance/rest'
import type { KlineInterval } from '@/lib/binance/types'

export function useWatchlistTickers(symbols: string[]) {
  return useQuery({
    queryKey: ['tickers', symbols],
    queryFn: () => fetchTickers24h(symbols),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useKlines(symbol: string, interval: KlineInterval) {
  return useQuery({
    queryKey: ['klines', symbol, interval],
    queryFn: () => fetchKlines(symbol, interval, 300),
    staleTime: 15_000,
  })
}

export function useDepthSnapshot(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ['depth', symbol],
    queryFn: () => fetchDepth(symbol, 100),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
