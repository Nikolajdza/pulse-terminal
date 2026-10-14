import { AppHeader } from '@/features/connection/header'
import { FlowHeatmap } from '@/features/flow/flow-heatmap'
import { PriceChart } from '@/features/chart/price-chart'
import { OrderBook } from '@/features/orderbook/order-book'
import { PerformanceLab } from '@/features/performance-lab/performance-lab'
import { StatusBar } from '@/features/status/status-bar'
import { MarketStats } from '@/features/symbols/market-stats'
import { Watchlist } from '@/features/symbols/watchlist'
import { TickerRow } from '@/features/ticker/ticker-row'
import { TickerTape } from '@/features/ticker/ticker-tape'
import { LiveTrades } from '@/features/trades/live-trades'
import { useDocumentLocale } from '@/hooks/use-document-locale'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useMarketStream } from '@/hooks/use-market-stream'
import { usePerformanceLab } from '@/hooks/use-performance-lab'

function Dashboard() {
  useMarketStream()
  usePerformanceLab()
  useKeyboardShortcuts()
  useDocumentLocale()

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <TickerTape />

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 gap-2 p-2 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:grid-rows-[auto_minmax(0,1fr)_auto]">
        <section className="flex flex-col gap-2 lg:row-span-2">
          <MarketStats />
          <Watchlist />
        </section>

        <section className="flex min-w-0 flex-col gap-2">
          <TickerRow />
          <PriceChart />
          <FlowHeatmap />
        </section>

        <section className="flex min-w-0 flex-col gap-2 lg:row-span-2">
          <OrderBook />
          <LiveTrades />
        </section>

        <section className="lg:col-start-2">
          <PerformanceLab />
        </section>
      </main>

      <StatusBar />
    </div>
  )
}

export default function App() {
  return <Dashboard />
}
