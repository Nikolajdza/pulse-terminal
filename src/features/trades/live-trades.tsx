import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel'
import { useI18n } from '@/hooks/use-i18n'
import { baseAsset, cn, displayPair, formatNumber, formatQty } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

export function LiveTrades() {
  const trades = useMarketStore((s) => s.trades)
  const parentRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  const virtualizer = useVirtualizer({
    count: trades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 16,
  })

  return (
    <Panel className="min-h-[280px]">
      <PanelHeader
        title={t('liveTrades')}
        meta={<span className="text-[10px] text-muted-foreground">{t('newestFirst')}</span>}
      />
      <PanelBody className="flex min-h-0 flex-col p-2 pt-1">
        <div className="mb-1 grid grid-cols-[1.1fr_1fr_1fr] gap-2 px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>{t('pair')}</span>
          <span className="text-right">{t('price')}</span>
          <span className="text-right">{t('qty')}</span>
        </div>

        {trades.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            {t('waitingTrades')}
          </div>
        ) : (
          <div ref={parentRef} className="h-[240px] overflow-auto pr-0.5">
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((item) => {
                const trade = trades[item.index]!
                const buy = !trade.isBuyerMaker
                return (
                  <div
                    key={trade.id}
                    className="absolute left-0 grid w-full grid-cols-[1.1fr_1fr_1fr] items-center gap-2 border-b border-border/40 px-1 font-mono text-[11px] tabular"
                    style={{
                      height: `${item.size}px`,
                      transform: `translateY(${item.start}px)`,
                    }}
                  >
                    <span className="truncate text-foreground">{displayPair(trade.symbol)}</span>
                    <span className={cn('text-right', buy ? 'text-up' : 'text-down')}>
                      {formatNumber(trade.price, trade.price >= 1000 ? 2 : 4)}
                    </span>
                    <span className="truncate text-right text-muted-foreground">
                      {formatQty(trade.qty, baseAsset(trade.symbol))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="mt-2 px-1 text-[10px] text-muted-foreground">{t('tradesNote')}</p>
      </PanelBody>
    </Panel>
  )
}
