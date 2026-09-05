import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { ScryfallCard } from '../../types/scryfall'
import type { Card } from '../../types/card'

interface Props {
  card: Card | null
  open: boolean
  onClose: () => void
  onSelect: (scryfall: ScryfallCard) => void
}

export function VariantPicker({ card, open, onClose, onSelect }: Props) {
  const [variants, setVariants] = useState<ScryfallCard[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !card) return
    const fetchVariants = async () => {
      setLoading(true)
      try {
        const { searchScryfallExact } = await import('../../services/scryfall')
        const { editionToSetCode } = await import('../../lib/mtg-sets')
        const base = await searchScryfallExact(card.name_en || card.name_es, card.edition, card.language, card.goldfish_url)
        if (!base) {
          setVariants([])
          return
        }
        const printsUri = (base as unknown as { prints_search_uri?: string }).prints_search_uri
        if (!printsUri) {
          setVariants([base])
          return
        }
        const r = await fetch(printsUri, { headers: { Accept: 'application/json' } })
        if (!r.ok) {
          setVariants([base])
          return
        }
        const data = (await r.json()) as { data: ScryfallCard[] }
        const expectedSet = editionToSetCode(card.edition)
        const setFiltered = expectedSet ? data.data.filter(c => c.set.toLowerCase() === expectedSet.toLowerCase()) : data.data
        const toShow = setFiltered.length > 0 ? setFiltered : data.data
        setVariants(toShow.slice(0, 12))
      } catch {
        setVariants([])
      } finally {
        setLoading(false)
      }
    }
    fetchVariants()
  }, [open, card])

  if (!card) return null

  return (
    <Modal open={open} onClose={onClose} title={`Elige variante — ${card.name_en ?? card.name_es} (${card.edition})`}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Esta carta tiene varias impresiones con mismo nombre y edición pero distinto arte. El link Goldfish <span className="text-amber-300">{card.goldfish_url?.split('/').pop()?.replace('+',' ')}</span> indica la variante. Elige la correcta:
        </p>
        {loading && <p className="text-sm text-zinc-500">Cargando variantes…</p>}
        {!loading && variants.length === 0 && <p className="text-sm text-zinc-500">No se encontraron variantes.</p>}
        <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-auto pr-1">
          {variants.map(v => (
            <button
              key={v.id}
              onClick={() => onSelect(v)}
              className="group text-left rounded-xl border border-zinc-700 bg-zinc-800 p-2 hover:border-amber-500 hover:bg-zinc-700 transition text-xs"
            >
              <img src={v.image_uris?.small ?? v.image_uris?.normal ?? ''} alt={v.name} className="w-full rounded-lg mb-2 aspect-[2.5/3.5] object-cover" loading="lazy" />
              <div className="font-medium text-white truncate">{v.name} — {v.set.toUpperCase()} #{v.collector_number}</div>
              <div className="text-zinc-400 truncate">{(v as unknown as { artist?: string }).artist ?? ''}</div>
              <div className="text-amber-400 truncate">{v.scryfall_uri}</div>
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}
