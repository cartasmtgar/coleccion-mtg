import { Badge } from '../ui/Badge'
import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'
import { RARITY_LABELS } from '../../types/card'

type AggregatedCard = Card & { _total?: number; _langs?: Record<string, number> }

export function CardGrid({ cards, onSelect }: { cards: (Card & { _total?: number; _langs?: Record<string, number> })[]; onSelect: (c: Card) => void }) {
  if (cards.length === 0) {
    return <p className="py-12 text-center text-zinc-500">No se encontraron cartas con los filtros actuales.</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.id}
          onClick={() => onSelect(card)}
          className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-amber-600/50 hover:shadow-lg hover:shadow-amber-900/10"
        >
          <div className="aspect-[2.5/3.5] overflow-hidden bg-zinc-800">
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name_es}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 text-center">
                <span className="text-sm text-zinc-500">Sin imagen<br />Sincroniza con Scryfall</span>
              </div>
            )}
          </div>
          <div className="space-y-2 p-3">
            <h3 className="line-clamp-1 font-semibold text-white">{card.name_es}</h3>
            {card.name_en && card.name_en !== card.name_es && (
              <p className="line-clamp-1 text-xs text-zinc-500">{card.name_en}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {card.rarity && (
                <Badge variant={card.rarity === 'mythic' ? 'mythic' : card.rarity === 'rare' ? 'rare' : 'default'}>
                  {RARITY_LABELS[card.rarity] ?? card.rarity}
                </Badge>
              )}
              {card.edition && <Badge variant="outline">{card.edition}</Badge>}
              <Badge variant="outline">{(card as AggregatedCard).language}</Badge>
              {(card as AggregatedCard)._langs && Object.keys((card as AggregatedCard)._langs!).length > 1 && (
                <Badge variant="outline" className="bg-amber-900/20 text-amber-300 border-amber-700/30">
                  {Object.entries((card as AggregatedCard)._langs!).map(([l,q])=>`${l} x${q}`).join(' · ')}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
              <span>
                {(card as AggregatedCard)._total ? `Total x${(card as AggregatedCard)._total}` : `x${card.quantity}`}{card.condition ? ` · ${card.condition}` : ''}
              </span>
              <span className="font-semibold text-amber-400">{formatPrice(card.price_usd)}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
