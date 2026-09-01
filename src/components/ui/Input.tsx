import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="text-sm font-medium text-zinc-300" {...props}>
      {children}
    </label>
  )
}
