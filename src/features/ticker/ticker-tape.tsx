import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { cn, displayPair, formatNumber, formatPercent } from '@/lib/utils'
import { playTick } from '@/lib/sound'
import { useMarketStore } from '@/stores/market-store'
import { useUiStore } from '@/stores/ui-store'

export function TickerTape() {
  const watchlist = useMarketStore((s) => s.watchlist)
  const tickers = useMarketStore((s) => s.tickers)
  const activeSymbol = useMarketStore((s) => s.activeSymbol)
  const setActiveSymbol = useMarketStore((s) => s.setActiveSymbol)
  const soundEnabled = useUiStore((s) => s.soundEnabled)
  const { t } = useI18n()
  const prevRef = useRef<Record<string, number>>({})
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down'>>({})

  useEffect(() => {
    const nextFlashes: Record<string, 'up' | 'down'> = {}
    for (const symbol of watchlist) {
      const price = tickers[symbol]?.lastPrice
      if (price == null) continue
      const prev = prevRef.current[symbol]
      if (prev != null && prev !== price) {
        const direction = price > prev ? 'up' : 'down'
        nextFlashes[symbol] = direction
        if (soundEnabled && symbol === activeSymbol) playTick(direction === 'up')
      }
      prevRef.current[symbol] = price
    }
    if (Object.keys(nextFlashes).length === 0) return
    setFlashes((current) => ({ ...current, ...nextFlashes }))
    const timer = window.setTimeout(() => {
      setFlashes((current) => {
        const copy = { ...current }
        for (const key of Object.keys(nextFlashes)) delete copy[key]
        return copy
      })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [tickers, watchlist, soundEnabled, activeSymbol])

  const items = [...watchlist, ...watchlist]

  return (
    <div
      className="relative overflow-hidden border-b border-border bg-background"
      aria-label={t('tickerTape')}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />
      <div className="tape-track flex w-max gap-2 px-2 py-1.5">
        {items.map((symbol, index) => {
          const ticker = tickers[symbol]
          const change = ticker?.priceChangePercent ?? 0
          const flash = flashes[symbol]
          return (
            <button
              key={`${symbol}-${index}`}
              type="button"
              onClick={() => setActiveSymbol(symbol)}
              className={cn(
                'flex items-center gap-2 rounded-md border border-border/80 bg-card/70 px-2.5 py-1 font-mono text-[11px] tabular transition-colors hover:border-primary/40',
                activeSymbol === symbol && 'border-primary/40 bg-primary/5',
                flash === 'up' && 'flash-up',
                flash === 'down' && 'flash-down',
              )}
            >
              <span className="text-foreground">{displayPair(symbol)}</span>
              <span className="text-muted-foreground">
                {ticker ? formatNumber(ticker.lastPrice, ticker.lastPrice >= 1000 ? 2 : 4) : '—'}
              </span>
              <span className={change >= 0 ? 'text-up' : 'text-down'}>
                {ticker ? formatPercent(change) : '—'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
