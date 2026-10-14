import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-panel/90 shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]',
        className,
      )}
      {...props}
    />
  )
}

export function PanelHeader({
  title,
  meta,
  className,
  children,
}: {
  title: ReactNode
  meta?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {meta}
      </div>
      {children}
    </div>
  )
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-h-0 flex-1 p-3', className)} {...props} />
}
