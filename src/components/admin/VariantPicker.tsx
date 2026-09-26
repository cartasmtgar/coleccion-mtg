import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { ScryfallCard } from '../../types/scryfall'
import type { Card } from '../../types/card'
import { searchScryfallExact } from '../../services/scryfall'
import { editionToSetCode } from '../../lib/mtg-sets'

interface Props {
  card: Card | null
  open: boolean
  onClose: () => void
  onSelect: (scryfall: ScryfallCard) => void
}

export function VariantPicker({ card, open, onClose, onSelect }: Props) {
  const [variants, setVariants] = useState<ScryfallCard[]>([])
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!open || !card) return
    const id = ++requestId.current
    const fetchVariants = async () => {
      // Vaciar lo anterior al instante: nunca mostrar variantes de otra carta
      setVariants([])
      setLoading(true)
      try {
        const base = await searchScryfallExact(card.name_en || card.name_es, card.edition, card.language, card.goldfish_url)
        if (requestId.current !== id) return // respuesta vieja: ignorar
        if (!base) {
          setVariants([])
          return
        }
        const printsUri = (base as unknown as { prints_search_uri?: string }).prints_search_uri
        const oracleId = (base as unknown as { oracle_id?: string }).oracle_id
        const expectedSet = editionToSetCode(card.edition)
        // Filtro por set en el SERVIDOR (ver scryfall.ts): prints_search_uri
        // pagina de a 175 y para cartas viejas la primera página no trae el set.
        const url = oracleId && expectedSet
          ? `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`oracleid:${oracleId} e:${expectedSet}`)}&unique=prints`
          : printsUri
        if (!url) {
          setVariants([base])
          return
        }
        const r = await fetch(url, { headers: { Accept: 'application/json' } })
        if (requestId.current !== id) return // respuesta vieja: ignorar
        if (!r.ok) {
          setVariants([base])
          return
        }
        const data = (await r.json()) as { data: ScryfallCard[] }
        // Regla de oro: solo mostrar impresiones del set del Excel.
        // Sin fallback a otros sets (evita DKM/WC02/CST/PTC).
        const setFiltered = expectedSet ? data.data.filter(c => c.set.toLowerCase() === expectedSet.toLowerCase()) : data.data
        const toShow = [...setFiltered].sort((a, b) => a.collector_number.localeCompare(b.collector_number, undefined, { numeric: true }))
        if (requestId.current !== id) return // respuesta vieja: ignorar
        setVariants(toShow.slice(0, 12))
      } catch {
        if (requestId.current !== id) return
        setVariants([])
      } finally {
        if (requestId.current === id) setLoading(false)
      }
    }
    fetchVariants()
  }, [open, card])

  if (!card) return null

  return (
    <Modal open={open} onClose={onClose} title={`Elige variante — ${card.name_en ?? card.name_es} (${card.edition})`}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Esta carta tiene varias impresiones con mismo nombre y edición pero distinto arte. El link Goldfish{' '}
          {card.goldfish_url ? (
            <a
              href={card.goldfish_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 underline hover:text-amber-200"
            >
              {card.goldfish_url.split('/').pop()?.replace(/\+/g, ' ')}
            </a>
          ) : (
            <span className="text-amber-300">sin referencia</span>
          )}{' '}
          indica la variante. Elige la correcta:
        </p>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-zinc-400">
            <Loader2 size={28} className="animate-spin text-amber-400" />
            <p>Buscando variantes en Scryfall…</p>
          </div>
        ) : (
          <>
            {variants.length === 0 && <p className="text-sm text-zinc-500">No se encontraron variantes.</p>}
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
          </>
        )}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </Modal>
  )
}
