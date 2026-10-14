import { useI18n } from '@/hooks/use-i18n'
import { formatNumber } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

export function StatusBar() {
  const metrics = useMarketStore((s) => s.metrics)
  const status = useMarketStore((s) => s.connectionStatus)
  const labRunning = useMarketStore((s) => s.labRunning)
  const { t } = useI18n()

  const kbps =
    metrics.eventsPerSecond > 0
      ? ((metrics.eventsPerSecond * 180) / 1024).toFixed(1)
      : '0.0'

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-3 font-mono text-[10px] text-muted-foreground">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-cyan">{t('source')}</span>
        <span>
          {t('dataRate')}: <span className="text-foreground">{kbps} KB/s</span>
        </span>
        <span>
          {t('eventsPerSec')}:{' '}
          <span className="text-foreground">{formatNumber(metrics.eventsPerSecond, 0)}</span>
        </span>
        <span>
          {t('uiHz')}: <span className="text-foreground">{metrics.uiUpdateHz}</span>
        </span>
        <span>
          {t('dropped')}:{' '}
          <span className={metrics.eventsDropped > 0 ? 'text-amber-400' : 'text-foreground'}>
            {formatNumber(metrics.eventsDropped, 0)}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        {labRunning && <span className="text-amber-400">{t('statusSimulating')}</span>}
        <span className="uppercase tracking-wide">{status}</span>
      </div>
    </footer>
  )
}
