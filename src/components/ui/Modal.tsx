import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { PropsWithChildren } from 'react'

interface Props extends PropsWithChildren {
  open: boolean
  onClose: () => void
  title?: string
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : <span />}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
