import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel'
import { useI18n } from '@/hooks/use-i18n'
import { cn, displayPair, formatNumber, formatPercent, formatPrice } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

export function MarketStats() {
  const symbol = useMarketStore((s) => s.activeSymbol)
  const ticker = useMarketStore((s) => s.tickers[s.activeSymbol])
  const { t } = useI18n()
  const change = ticker?.priceChangePercent ?? 0

  return (
    <Panel>
      <PanelHeader title={t('marketStats')} meta={<span className="font-mono text-[10px] text-cyan">{displayPair(symbol)}</span>} />
      <PanelBody className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('lastPrice')}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular tracking-tight text-foreground">
            {ticker ? formatPrice(ticker.lastPrice) : '—'}
          </p>
          <p className={cn('mt-1 font-mono text-sm tabular', change >= 0 ? 'text-up' : 'text-down')}>
            {ticker ? formatPercent(change) : '—'}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <Stat label={t('high24h')} value={ticker ? formatNumber(ticker.highPrice, 2) : '—'} />
          <Stat label={t('low24h')} value={ticker ? formatNumber(ticker.lowPrice, 2) : '—'} />
          <Stat label={t('volume24h')} value={ticker ? formatNumber(ticker.volume, 2) : '—'} />
          <Stat label={t('quoteVolume')} value={ticker ? formatNumber(ticker.quoteVolume, 0) : '—'} />
        </dl>
      </PanelBody>
    </Panel>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/80 bg-muted/30 px-2 py-1.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-[12px] tabular text-foreground">{value}</dd>
    </div>
  )
}
