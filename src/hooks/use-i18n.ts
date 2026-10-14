import { useCallback } from 'react'
import { translations, type TranslationKey } from '@/i18n/translations'
import { useUiStore } from '@/stores/ui-store'

export function useI18n() {
  const locale = useUiStore((s) => s.locale)
  const setLocale = useUiStore((s) => s.setLocale)

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key],
    [locale],
  )

  return { t, locale, setLocale }
}
