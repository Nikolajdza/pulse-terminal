import { useEffect, useRef } from 'react'
import { getWebSocketManager } from '@/lib/ws/manager'
import { useMarketStore } from '@/stores/market-store'

export function usePerformanceLab() {
  const labRunning = useMarketStore((s) => s.labRunning)
  const labEventsPerSecond = useMarketStore((s) => s.labEventsPerSecond)
  const activeSymbol = useMarketStore((s) => s.activeSymbol)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!labRunning || labEventsPerSecond <= 0) return

    const manager = getWebSocketManager()
    const tickMs = 100
    const perTick = Math.max(1, Math.round(labEventsPerSecond / (1000 / tickMs)))

    timerRef.current = setInterval(() => {
      const now = Date.now()
      manager.injectSynthetic(perTick, (index) => ({
        stream: `${activeSymbol.toLowerCase()}@trade`,
        receivedAt: performance.now(),
        data: {
          e: 'trade',
          E: now,
          s: activeSymbol,
          t: now * 1000 + index,
          p: String(67000 + (Math.random() - 0.5) * 40),
          q: String(Math.random() * 0.5),
          T: now,
          m: Math.random() > 0.5,
        },
      }))
    }, tickMs)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [labRunning, labEventsPerSecond, activeSymbol])
}
