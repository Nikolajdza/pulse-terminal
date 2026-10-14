import { useMemo } from 'react'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel'
import { useI18n } from '@/hooks/use-i18n'
import { cn, displayPair, formatNumber } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

function compact(value: number): string {
  const sign = value > 0 ? '+' : ''
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${sign}${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(value / 1_000).toFixed(1)}K`
  return `${sign}${formatNumber(value, 0)}`
}

export function FlowHeatmap() {
  const flow = useMarketStore((s) => s.flow)
  const cvd = useMarketStore((s) => s.cvd)
  const symbol = useMarketStore((s) => s.activeSymbol)
  const { t } = useI18n()

  const series = useMemo(() => {
    let running = 0
    return flow.map((bucket) => {
      const delta = bucket.buy - bucket.sell
      running += delta
      return { ...bucket, delta, running }
    })
  }, [flow])

  const maxAbs = Math.max(1, ...series.map((point) => Math.abs(point.delta)))
  const minRun = Math.min(0, ...series.map((point) => point.running))
  const maxRun = Math.max(0, ...series.map((point) => point.running))
  const span = maxRun - minRun || 1
  const buyTotal = series.reduce((sum, point) => sum + point.buy, 0)
  const sellTotal = series.reduce((sum, point) => sum + point.sell, 0)

  const line = series
    .map((point, index) => {
      const x = series.length === 1 ? 0 : (index / (series.length - 1)) * 100
      const y = 100 - ((point.running - minRun) / span) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <Panel>
      <PanelHeader
        title={t('flow')}
        meta={<span className="font-mono text-[10px] text-cyan">{displayPair(symbol)}</span>}
      >
        <span className={cn('font-mono text-[11px] tabular', cvd >= 0 ? 'text-up' : 'text-down')}>
          {t('cvd')} {compact(cvd)}
        </span>
      </PanelHeader>
      <PanelBody className="space-y-2 p-3">
        {series.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            {t('waitingFlow')}
          </div>
        ) : (
          <div className="relative h-24 overflow-hidden rounded-md border border-border bg-muted/20">
            <div className="absolute inset-0 flex items-end gap-px px-1 pb-1 pt-5">
              {series.map((point) => {
                const intensity = 0.18 + (Math.abs(point.delta) / maxAbs) * 0.82
                const height = 18 + (Math.abs(point.delta) / maxAbs) * 82
                return (
                  <div
                    key={point.start}
                    className="min-w-0 flex-1 rounded-sm"
                    style={{
                      height: `${height}%`,
                      backgroundColor:
                        point.delta >= 0
                          ? `rgb(61 255 138 / ${intensity})`
                          : `rgb(255 77 106 / ${intensity})`,
                    }}
                    title={`${compact(point.delta)}`}
                  />
                )
              })}
            </div>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-1 top-1 h-12"
              aria-hidden
            >
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                vectorEffect="non-scaling-stroke"
                className="text-cyan"
                points={line}
              />
            </svg>
          </div>
        )}

        <div className="flex items-center justify-between font-mono text-[11px] tabular">
          <span className="text-up">
            {t('buyVol')} {compact(buyTotal)}
          </span>
          <span className="text-down">
            {t('sellVol')} {compact(sellTotal)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">{t('flowNote')}</p>
      </PanelBody>
    </Panel>
  )
}
