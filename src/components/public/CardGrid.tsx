import { Check, Loader2, Minus, Pencil, RefreshCw, Shield } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'

type AggregatedCard = Card & { _total?: number; _langs?: Record<string, number> }

export function CardGrid({ cards, onSelect, page = 0, showOwner = false, onSync, syncingId = null, onEdit, onToggleReviewed }: { cards: (Card & { _total?: number; _langs?: Record<string, number> })[]; onSelect: (c: Card) => void; page?: number; showOwner?: boolean; onSync?: (c: Card) => void; syncingId?: string | null; onEdit?: (c: Card) => void; onToggleReviewed?: (c: Card) => void }) {
  if (cards.length === 0) {
    return <p className="py-12 text-center text-zinc-500">No se encontraron cartas con los filtros actuales.</p>
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card, idx) => (
        <article
          key={`${card.id}-${page}-${idx}`}
          onClick={() => onSelect(card)}
          className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-amber-600/50 hover:shadow-lg hover:shadow-amber-900/10"
        >
          <div className="aspect-[2.5/3.5] bg-zinc-900 rounded-xl overflow-hidden" style={{ contentVisibility: 'visible' }}>
            {card.image_url ? (
              <img
                src={card.image_url}
                alt={card.name_en ?? card.name_es}
                loading="eager"
                decoding="sync"
                // @ts-ignore - fetchPriority es válido en img pero no tipado en React 19
                fetchPriority="high"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 p-6 text-center">
                <span className="text-sm text-zinc-500">Sin imagen<br />Sincroniza con Scryfall</span>
              </div>
            )}
          </div>
          <div className="space-y-2 p-3">
            <div className="flex items-center gap-2">
              <h3 className="line-clamp-1 flex-1 font-semibold text-white">{card.name_en ?? card.name_es}</h3>
              {card.is_reserved && (
                <span title="Reserved List — nunca se reimprime" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-400">
                  <Shield size={14} /> Reserved List
                </span>
              )}
              {onToggleReviewed && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleReviewed(card) }}
                  title={card.reviewed ? 'Check' : 'Sin revisar'}
                  aria-label={`${card.reviewed ? 'Check' : 'Sin revisar'}: ${card.name_en ?? card.name_es}`}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${card.reviewed ? 'border-emerald-600 bg-emerald-900/30 text-emerald-400 hover:border-emerald-500 hover:text-emerald-300' : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'}`}
                >
                  {card.reviewed ? <Check size={14} /> : <Minus size={14} />}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(card) }}
                  title="Editar carta"
                  aria-label={`Editar ${card.name_en ?? card.name_es}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 transition hover:border-amber-500 hover:text-amber-400"
                >
                  <Pencil size={14} />
                </button>
              )}
              {onSync && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSync(card) }}
                  disabled={syncingId === card.id}
                  title="Resincronizar con Scryfall"
                  aria-label={`Resincronizar ${card.name_en ?? card.name_es}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 transition hover:border-amber-500 hover:text-amber-400 disabled:opacity-50"
                >
                  {syncingId === card.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                </button>
              )}
            </div>
            {card.name_es && card.name_en && card.name_en !== card.name_es && (
              <p className="line-clamp-1 text-xs text-zinc-500">{card.name_es}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {card.rarity && (
                <Badge variant={card.rarity === 'mythic' ? 'mythic' : card.rarity === 'rare' ? 'rare' : 'default'}>
                  {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                </Badge>
              )}
              {card.edition && <Badge variant="outline">{card.edition}</Badge>}
              <Badge variant="outline">{(card as AggregatedCard).language}</Badge>
              {showOwner && card.owner && <Badge variant="outline">{card.owner}</Badge>}
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
              <span className="font-semibold text-amber-400">Precio u. {formatPrice(card.price_usd)}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
