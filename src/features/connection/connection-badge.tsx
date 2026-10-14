import { Radio, WifiOff, LoaderCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ConnectionStatus } from '@/lib/binance/types'
import { useI18n } from '@/hooks/use-i18n'
import { useMarketStore } from '@/stores/market-store'

function statusKey(status: ConnectionStatus) {
  switch (status) {
    case 'live':
      return 'live' as const
    case 'connecting':
      return 'connecting' as const
    case 'reconnecting':
      return 'reconnecting' as const
    default:
      return 'offline' as const
  }
}

export function ConnectionBadge() {
  const status = useMarketStore((s) => s.connectionStatus)
  const { t } = useI18n()
  const key = statusKey(status)

  if (status === 'live') {
    return (
      <Badge variant="live" aria-live="polite" className="h-7">
        <Radio className="size-3 animate-pulse" aria-hidden />
        {t(key)}
      </Badge>
    )
  }

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <Badge variant="warning" aria-live="polite" className="h-7">
        <LoaderCircle className="size-3 animate-spin" aria-hidden />
        {t(key)}
      </Badge>
    )
  }

  return (
    <Badge variant="danger" aria-live="polite" className="h-7">
      <WifiOff className="size-3" aria-hidden />
      {t(key)}
    </Badge>
  )
}
