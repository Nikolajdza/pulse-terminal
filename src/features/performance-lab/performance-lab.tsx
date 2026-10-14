import { Button } from '@/components/ui/button'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel'
import { useI18n } from '@/hooks/use-i18n'
import { cn, formatNumber } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

const PRESETS = [0, 1000, 5000, 10000] as const

export function PerformanceLab() {
  const metrics = useMarketStore((s) => s.metrics)
  const labEventsPerSecond = useMarketStore((s) => s.labEventsPerSecond)
  const labRunning = useMarketStore((s) => s.labRunning)
  const setLabEventsPerSecond = useMarketStore((s) => s.setLabEventsPerSecond)
  const setLabRunning = useMarketStore((s) => s.setLabRunning)
  const { t } = useI18n()

  return (
    <Panel>
      <PanelHeader
        title={t('performanceLab')}
        meta={<span className="text-[10px] text-amber-400">{t('syntheticLoad')}</span>}
      />
      <PanelBody className="space-y-3 p-3">
        <p className="text-xs text-muted-foreground">{t('labBlurb')}</p>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={labEventsPerSecond === value ? 'default' : 'outline'}
              className="h-7 px-2.5 text-[11px]"
              onClick={() => {
                setLabEventsPerSecond(value)
                setLabRunning(value > 0)
              }}
            >
              {value === 0 ? t('stop') : `${formatNumber(value, 0)}/s`}
            </Button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label={t('eventsReceived')} value={formatNumber(metrics.eventsReceived, 0)} />
          <Metric label={t('eventsPerSec')} value={formatNumber(metrics.eventsPerSecond, 0)} />
          <Metric
            label={t('eventsDropped')}
            value={formatNumber(metrics.eventsDropped, 0)}
            warn={metrics.eventsDropped > 0}
          />
          <Metric label={t('uiUpdateRate')} value={`${metrics.uiUpdateHz} Hz`} />
          <Metric
            label={t('latency')}
            value={metrics.latencyMs != null ? `${Math.round(metrics.latencyMs)} ms` : '—'}
          />
        </div>

        <p className="text-[10px] text-muted-foreground">
          {t('labStatus')}:{' '}
          {labRunning
            ? `${t('statusSimulating')} ~${formatNumber(labEventsPerSecond, 0)}/s`
            : t('statusIdle')}
        </p>
      </PanelBody>
    </Panel>
  )
}

function Metric({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 font-mono text-sm tabular', warn && 'text-amber-400')}>{value}</p>
    </div>
  )
}
