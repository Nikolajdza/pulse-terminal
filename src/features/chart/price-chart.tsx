import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
} from 'lightweight-charts'
import { Button } from '@/components/ui/button'
import { Panel, PanelBody, PanelHeader } from '@/components/ui/panel'
import { useKlines } from '@/hooks/use-binance-queries'
import { useI18n } from '@/hooks/use-i18n'
import type { KlineInterval } from '@/lib/binance/types'
import { cn, displayPair } from '@/lib/utils'
import { useMarketStore } from '@/stores/market-store'

const INTERVALS: KlineInterval[] = ['1m', '5m', '1h', '1d']

export function PriceChart() {
  const symbol = useMarketStore((s) => s.activeSymbol)
  const interval = useMarketStore((s) => s.interval)
  const setInterval = useMarketStore((s) => s.setInterval)
  const liveCandle = useMarketStore((s) => s.liveCandle)
  const { data, isLoading, isError, refetch } = useKlines(symbol, interval)
  const { t } = useI18n()

  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#7d8590',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.05)', style: 2 },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        vertLine: { color: 'rgba(61,255,138,0.35)' },
        horzLine: { color: 'rgba(61,255,138,0.35)' },
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#3dff8a',
      downColor: '#ff4d6a',
      borderVisible: false,
      wickUpColor: '#3dff8a',
      wickDownColor: '#ff4d6a',
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !data) return
    const candles: CandlestickData[] = data.map((candle) => ({
      time: candle.time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))
    seriesRef.current.setData(candles)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  useEffect(() => {
    if (!seriesRef.current || !liveCandle) return
    seriesRef.current.update({
      time: liveCandle.time as UTCTimestamp,
      open: liveCandle.open,
      high: liveCandle.high,
      low: liveCandle.low,
      close: liveCandle.close,
    })
  }, [liveCandle])

  return (
    <Panel className="min-h-[320px]">
      <PanelHeader
        title={t('priceHistory')}
        meta={<span className="font-mono text-[10px] text-cyan">{displayPair(symbol)}</span>}
      >
        <div className="flex items-center gap-0.5" role="group" aria-label="Chart timeframe">
          {INTERVALS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={interval === value ? 'secondary' : 'ghost'}
              className={cn(
                'h-6 px-2 font-mono text-[10px] uppercase',
                interval === value && 'bg-accent text-foreground',
              )}
              onClick={() => setInterval(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </PanelHeader>
      <PanelBody className="relative flex min-h-0 flex-col p-2 pt-1">
        {isLoading && (
          <div className="absolute inset-2 animate-pulse rounded bg-muted/40" />
        )}
        {isError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-panel/90">
            <div className="text-center">
              <p className="text-xs text-destructive">{t('chartError')}</p>
              <Button className="mt-2" size="sm" variant="outline" onClick={() => void refetch()}>
                {t('retry')}
              </Button>
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-[260px] w-full flex-1 sm:h-[300px]" />
        <p className="mt-1 px-1 text-[10px] text-muted-foreground">{t('chartNote')}</p>
      </PanelBody>
    </Panel>
  )
}
