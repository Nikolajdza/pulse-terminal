import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/hooks/use-i18n'
import { useUiStore } from '@/stores/ui-store'
import { ConnectionBadge } from './connection-badge'

export function AppHeader() {
  const { t, locale, setLocale } = useI18n()
  const soundEnabled = useUiStore((s) => s.soundEnabled)
  const toggleSound = useUiStore((s) => s.toggleSound)
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)

  return (
    <header className="flex h-12 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
          <span className="font-mono text-xs font-bold text-primary">P</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="truncate text-sm font-bold tracking-tight text-foreground">
              {t('brand')}
            </h1>
            <span className="hidden font-mono text-[10px] text-cyan sm:inline">v1.0</span>
          </div>
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {t('tagline')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ConnectionBadge />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 px-2 text-[11px]"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={t('sound')}
        >
          {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          <span className="hidden sm:inline">{soundEnabled ? t('soundOn') : t('soundOff')}</span>
        </Button>
        <div
          className="flex overflow-hidden rounded-md border border-border"
          role="group"
          aria-label={t('theme')}
        >
          <button
            type="button"
            className={`h-7 px-2 text-[11px] font-medium ${
              theme === 'classic' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setTheme('classic')}
          >
            {t('classic')}
          </button>
          <button
            type="button"
            className={`h-7 border-l border-border px-2 text-[11px] font-medium ${
              theme === 'oled' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setTheme('oled')}
          >
            {t('oled')}
          </button>
        </div>
        <div
          className="flex overflow-hidden rounded-md border border-border"
          role="group"
          aria-label={t('language')}
        >
          <button
            type="button"
            className={`h-7 px-2 text-[11px] font-medium ${
              locale === 'en' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`h-7 border-l border-border px-2 text-[11px] font-medium ${
              locale === 'sr' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setLocale('sr')}
          >
            SR
          </button>
        </div>
      </div>
    </header>
  )
}
