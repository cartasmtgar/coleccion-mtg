import type { PropsWithChildren } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'default' | 'rare' | 'mythic' | 'common' | 'uncommon' | 'outline'

const variants: Record<Variant, string> = {
  default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  common: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  uncommon: 'bg-slate-700 text-slate-200 border-slate-600',
  rare: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  mythic: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  outline: 'bg-transparent text-zinc-400 border-zinc-600',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: PropsWithChildren<{ variant?: Variant; className?: string }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
