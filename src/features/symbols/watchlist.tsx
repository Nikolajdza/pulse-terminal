import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel'
import { useI18n } from '@/hooks/use-i18n'
import { cn, displayPair, formatPercent, formatPrice } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

export function Watchlist() {
  const watchlist = useMarketStore((s) => s.watchlist)
  const activeSymbol = useMarketStore((s) => s.activeSymbol)
  const setActiveSymbol = useMarketStore((s) => s.setActiveSymbol)
  const tickers = useMarketStore((s) => s.tickers)
  const { t } = useI18n()

  return (
    <Panel className="min-h-0 flex-1">
      <PanelHeader
        title={t('watchlist')}
        meta={
          <span className="text-[10px] text-muted-foreground">
            {watchlist.length} {t('symbols')}
          </span>
        }
      />
      <PanelBody className="p-0">
        <ul className="divide-y divide-border">
          {watchlist.map((symbol, index) => {
            const ticker = tickers[symbol]
            const change = ticker?.priceChangePercent ?? 0
            const active = symbol === activeSymbol
            return (
              <li key={symbol}>
                <button
                  type="button"
                  onClick={() => setActiveSymbol(symbol)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/70',
                    active && 'bg-primary/8 border-l-2 border-l-primary',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                      <p className="truncate text-sm font-medium">{displayPair(symbol)}</p>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] tabular text-muted-foreground">
                      {ticker ? formatPrice(ticker.lastPrice) : '—'}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] tabular',
                      change >= 0 ? 'bg-up/10 text-up' : 'bg-down/10 text-down',
                    )}
                  >
                    {ticker ? formatPercent(change) : '—'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          {t('shortcuts')}
        </p>
      </PanelBody>
    </Panel>
  )
}
