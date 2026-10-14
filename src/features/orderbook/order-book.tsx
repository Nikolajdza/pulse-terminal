import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel'
import { useI18n } from '@/hooks/use-i18n'
import { cn, displayPair, formatNumber } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

export function OrderBook() {
  const symbol = useMarketStore((s) => s.activeSymbol)
  const bids = useMarketStore((s) => s.bids)
  const asks = useMarketStore((s) => s.asks)
  const { t } = useI18n()

  const maxQty = Math.max(
    0.0001,
    ...bids.map((level) => level.qty),
    ...asks.map((level) => level.qty),
  )

  const bestBid = bids[0]?.price
  const bestAsk = asks[0]?.price
  const spread =
    bestBid != null && bestAsk != null ? bestAsk - bestBid : null

  const askRows = [...asks].reverse()

  return (
    <Panel className="min-h-[320px]">
      <PanelHeader
        title={t('orderBook')}
        meta={<span className="font-mono text-[10px] text-cyan">{displayPair(symbol)}</span>}
      />
      <PanelBody className="flex min-h-0 flex-col p-2 pt-1">
        <div className="mb-1 grid grid-cols-3 gap-2 px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>{t('price')}</span>
          <span className="text-right">{t('size')}</span>
          <span className="text-right">{t('total')}</span>
        </div>

        {bids.length === 0 && asks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            {t('syncingDepth')}
          </div>
        ) : (
          <div className="space-y-1 font-mono text-[11px] tabular">
            <div className="space-y-px">
              {askRows.map((level) => (
                <DepthRow
                  key={`a-${level.price}`}
                  price={level.price}
                  qty={level.qty}
                  maxQty={maxQty}
                  side="ask"
                />
              ))}
            </div>
            <div className="flex items-center justify-between border-y border-border bg-muted/30 px-1 py-1.5 text-[11px]">
              <span className="uppercase tracking-wide text-muted-foreground">
                {t('spread')}
              </span>
              <span className="font-semibold text-foreground">
                {spread != null ? formatNumber(spread, spread < 1 ? 4 : 2) : '—'}
              </span>
              <span className="text-muted-foreground">{t('liveDepth')}</span>
            </div>
            <div className="space-y-px">
              {bids.map((level) => (
                <DepthRow
                  key={`b-${level.price}`}
                  price={level.price}
                  qty={level.qty}
                  maxQty={maxQty}
                  side="bid"
                />
              ))}
            </div>
          </div>
        )}

        <p className="mt-2 px-1 text-[10px] text-muted-foreground">{t('depthNote')}</p>
      </PanelBody>
    </Panel>
  )
}

function DepthRow({
  price,
  qty,
  maxQty,
  side,
}: {
  price: number
  qty: number
  maxQty: number
  side: 'bid' | 'ask'
}) {
  const width = Math.min(100, (qty / maxQty) * 100)
  return (
    <div className="relative grid grid-cols-3 gap-2 px-1 py-0.5">
      <div
        className={cn(
          'absolute inset-y-0 right-0 opacity-25',
          side === 'bid' ? 'bg-up' : 'bg-down',
        )}
        style={{ width: `${width}%` }}
        aria-hidden
      />
      <span className={cn('relative', side === 'bid' ? 'text-up' : 'text-down')}>
        {formatNumber(price, price >= 1000 ? 2 : 4)}
      </span>
      <span className="relative text-right text-foreground">{formatNumber(qty, 4)}</span>
      <span className="relative text-right text-muted-foreground">
        {formatNumber(price * qty, 2)}
      </span>
    </div>
  )
}
