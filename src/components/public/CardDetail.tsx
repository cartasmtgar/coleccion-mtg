import { ExternalLink, Coins, ScrollText, ShieldCheck } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'
import type { ScryfallCard } from '../../types/scryfall'

export function CardDetail({
  card,
  scryfall,
  open,
  onClose,
}: {
  card: Card | null
  scryfall: ScryfallCard | null
  open: boolean
  onClose: () => void
}) {
  if (!card) return null

  const image = scryfall?.image_uris?.normal ?? card.image_url
  const price = scryfall?.prices.usd ? parseFloat(scryfall.prices.usd) : card.price_usd
  const text = scryfall?.oracle_text ?? scryfall?.card_faces?.[0]?.oracle_text

  return (
    <Modal open={open} onClose={onClose} title={card.name_en ?? card.name_es}>
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <div>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            {image ? (
              <img src={image} alt={card.name_en ?? card.name_es} className="w-full scale-[1.02] object-cover" />
            ) : (
              <div className="flex aspect-[2.5/3.5] items-center justify-center text-sm text-zinc-500">
                Sin imagen
              </div>
            )}
          </div>
          {card.scryfall_uri && (
            <a
              href={card.scryfall_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-amber-400 hover:underline"
            >
              Ver en Scryfall <ExternalLink size={14} />
            </a>
          )}
          {card.goldfish_url && (
            <a
              href={card.goldfish_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-amber-300 hover:underline"
            >
              Referencia Goldfish <ExternalLink size={14} />
            </a>
          )}
        </div>

        <div className="space-y-4">
          {card.name_es && card.name_en && card.name_en !== card.name_es && <p className="text-sm text-zinc-400">{card.name_es}</p>}

          <div className="flex flex-wrap gap-2">
            {card.edition && <Badge variant="outline">{card.edition}</Badge>}
            {card.rarity && <Badge variant={card.rarity === 'mythic' ? 'mythic' : 'rare'}>{card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</Badge>}
            <Badge variant="outline">{card.language}</Badge>
            {(card as unknown as { _langs?: Record<string, number> })._langs && Object.keys((card as unknown as { _langs: Record<string, number> })._langs).length > 0 && (
              <Badge variant="outline" className="bg-amber-900/20 text-amber-300 border-amber-700/30">
                {Object.entries((card as unknown as { _langs: Record<string, number> })._langs).map(([l,q])=>`${l} x${q}`).join(' · ')}
              </Badge>
            )}
            {card.condition && <Badge variant="outline">{card.condition}</Badge>}
            {card.year && <Badge variant="outline">{card.year}</Badge>}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-zinc-500">Tipo</dt><dd className="text-zinc-200">{card.type ?? scryfall?.type_line ?? '—'}</dd></div>
            <div><dt className="text-zinc-500">Cantidad total</dt><dd className="text-zinc-200">x{(card as unknown as { _total?: number })._total ?? card.quantity}</dd></div>
            <div><dt className="text-zinc-500">Dueño</dt><dd className="text-zinc-200">{card.owner ?? '—'}</dd></div>
            <div><dt className="text-zinc-500">Precio u.</dt><dd className="font-semibold text-amber-400">{formatPrice(price)}</dd></div>
          </dl>

          {text && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-zinc-200"><ScrollText size={16} /> Texto</h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{text}</p>
            </div>
          )}

          {scryfall?.legalities && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-200"><ShieldCheck size={16} /> Legalidades</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(scryfall.legalities).slice(0, 8).map(([fmt, status]) => (
                  <Badge key={fmt} variant={status === 'legal' ? 'common' : 'outline'} className={status === 'legal' ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40' : ''}>
                    {fmt}: {status}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {scryfall && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 mb-1 font-medium text-zinc-300"><Coins size={14} /> Precios Scryfall</div>
              <div className="flex gap-4">
                <span>USD: {scryfall.prices.usd ?? '—'}</span>
                <span>Foil: {scryfall.prices.usd_foil ?? '—'}</span>
                <span>EUR: {scryfall.prices.eur ?? '—'}</span>
              </div>
            </div>
          )}

          {card.notes && (
            <div className="rounded-lg bg-amber-950/30 border border-amber-800/30 p-3">
              <p className="text-xs font-medium text-amber-300">Notas</p>
              <p className="text-sm text-zinc-300">{card.notes}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
