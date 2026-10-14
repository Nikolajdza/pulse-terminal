import { useEffect } from 'react'
import { useWatchlistTickers } from '@/hooks/use-binance-queries'
import { useI18n } from '@/hooks/use-i18n'
import { useMarketStore } from '@/stores/market-store'
import { MetricCard } from './metric-card'

export function TickerRow() {
  const watchlist = useMarketStore((s) => s.watchlist)
  const tickers = useMarketStore((s) => s.tickers)
  const upsertTickers = useMarketStore((s) => s.upsertTickers)
  const featured = watchlist.slice(0, 2)
  const query = useWatchlistTickers(watchlist)
  const { t } = useI18n()

  useEffect(() => {
    if (query.data) upsertTickers(query.data)
  }, [query.data, upsertTickers])

  if (query.isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      >
        {t('snapshotError')}
      </div>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {featured.map((symbol) => (
        <MetricCard
          key={symbol}
          symbol={symbol}
          ticker={tickers[symbol]}
          loading={query.isLoading}
        />
      ))}
    </div>
  )
}
