import { useEffect } from 'react'
import { useUiStore } from '@/stores/ui-store'

export function useDocumentLocale() {
  const locale = useUiStore((s) => s.locale)
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dataset.theme = theme
  }, [locale, theme])
}
