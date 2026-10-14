import { useEffect } from 'react'
import { useMarketStore } from '@/stores/market-store'

export function useKeyboardShortcuts() {
  const watchlist = useMarketStore((s) => s.watchlist)
  const setActiveSymbol = useMarketStore((s) => s.setActiveSymbol)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const index = Number(event.key) - 1
      if (index >= 0 && index < watchlist.length) {
        event.preventDefault()
        setActiveSymbol(watchlist[index]!)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [watchlist, setActiveSymbol])
}
