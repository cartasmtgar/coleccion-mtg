import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

/** Botón flotante para volver arriba. Aparece al bajar 600px. */
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      title="Volver arriba"
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-300 shadow-lg shadow-black/40 backdrop-blur transition hover:border-amber-500 hover:text-amber-400"
    >
      <ArrowUp size={20} />
    </button>
  )
}
