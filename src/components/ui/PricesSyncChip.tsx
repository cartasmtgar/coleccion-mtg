import { useEffect, useState } from 'react'
import { getPricesSyncDate } from '../../services/cards.service'

/** "Precios actualizados el …" — no muestra nada si aún no hubo sincronizaciones. */
export function PricesSyncChip() {
  const [date, setDate] = useState<string | null>(null)

  useEffect(() => {
    getPricesSyncDate().then(setDate).catch(() => null)
  }, [])

  if (!date) return null
  const d = new Date(date)
  const label = Number.isNaN(d.getTime())
    ? date
    : d.toLocaleString('es-UY', { dateStyle: 'medium', timeStyle: 'short' })
  return <span className="text-xs text-zinc-500">Precios actualizados el {label}</span>
}
