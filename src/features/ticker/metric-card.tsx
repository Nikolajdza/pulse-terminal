import { Panel, PanelBody } from '@/components/ui/panel'
import { useI18n } from '@/hooks/use-i18n'
import { cn, displayPair, formatNumber, formatPercent, formatPrice } from '@/lib/utils'
import type { Ticker24h } from '@/lib/binance/types'
import { useMarketStore } from '@/stores/market-store'

interface MetricCardProps {
  symbol: string
  ticker?: Ticker24h
  loading?: boolean
}

export function MetricCard({ symbol, ticker, loading }: MetricCardProps) {
  const activeSymbol = useMarketStore((s) => s.activeSymbol)
  const setActiveSymbol = useMarketStore((s) => s.setActiveSymbol)
  const metrics = useMarketStore((s) => s.metrics)
  const { t } = useI18n()
  const isActive = activeSymbol === symbol
  const change = ticker?.priceChangePercent ?? 0
  const up = change >= 0

  return (
    <button
      type="button"
      onClick={() => setActiveSymbol(symbol)}
      className="w-full text-left"
      aria-pressed={isActive}
    >
      <Panel
        className={cn(
          'transition-colors',
          isActive ? 'border-primary/50 ring-1 ring-primary/20' : 'hover:border-border',
        )}
      >
        <PanelBody className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {displayPair(symbol)}
              </p>
              {loading && !ticker ? (
                <div className="mt-2 h-7 w-32 animate-pulse rounded bg-muted" />
              ) : (
                <p className="mt-1 font-mono text-xl font-semibold tabular tracking-tight sm:text-2xl">
                  {ticker ? formatPrice(ticker.lastPrice) : '—'}
                </p>
              )}
            </div>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-xs font-medium tabular',
                up ? 'bg-up/10 text-up' : 'bg-down/10 text-down',
              )}
            >
              {ticker ? formatPercent(change) : '—'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border pt-2 text-[11px]">
            <div>
              <p className="text-muted-foreground">{t('incomingEvents')}</p>
              <p className="mt-0.5 font-mono tabular text-foreground">
                {metrics.eventsPerSecond > 0
                  ? `${formatNumber(metrics.eventsPerSecond, 0)}/s`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('connectionLatency')}</p>
              <p className="mt-0.5 font-mono tabular text-foreground">
                {metrics.latencyMs != null ? `${Math.round(metrics.latencyMs)} ms` : '—'}
              </p>
            </div>
          </div>
        </PanelBody>
      </Panel>
    </button>
  )
}
