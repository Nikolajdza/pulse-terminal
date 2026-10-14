import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '@/i18n/translations'

export type Theme = 'classic' | 'oled'

interface UiState {
  locale: Locale
  theme: Theme
  soundEnabled: boolean
  setLocale: (locale: Locale) => void
  setTheme: (theme: Theme) => void
  toggleSound: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      locale: 'en',
      theme: 'classic',
      soundEnabled: false,
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    { name: 'pulse-terminal-ui' },
  ),
)
