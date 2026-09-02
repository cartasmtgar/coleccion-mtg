import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'

export function CardTable({ cards, onSelect }: { cards: (Card & { _total?: number; _langs?: Record<string, number> })[]; onSelect: (c: Card) => void }) {
  if (cards.length === 0) {
    return <p className="py-12 text-center text-zinc-500">No hay resultados.</p>
  }
  return (
    <div className="overflow-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Edición</th>
            <th className="px-4 py-3">Rareza</th>
            <th className="px-4 py-3">Idioma</th>
            <th className="px-4 py-3">Cond.</th>
            <th className="px-4 py-3">Cant.</th>
            <th className="px-4 py-3 text-right">Precio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-950">
          {cards.map((c) => (
            <tr
              key={c.id}
              onClick={() => onSelect(c)}
              className="cursor-pointer hover:bg-zinc-900"
            >
              <td className="px-4 py-3">
                <div className="font-medium text-white">{c.name_en ?? c.name_es}</div>
                {c.name_es && c.name_en && c.name_en !== c.name_es && <div className="text-xs text-zinc-500">{c.name_es}</div>}
              </td>
              <td className="px-4 py-3 text-zinc-300">{c.edition ?? '—'}</td>
              <td className="px-4 py-3 text-zinc-300">{c.rarity ?? '—'}</td>
              <td className="px-4 py-3 text-zinc-300">
                {c.language}
                {(c as unknown as { _langs?: Record<string, number> })._langs && Object.keys((c as unknown as { _langs?: Record<string, number> })._langs!).length > 1
                  ? ` (${Object.entries((c as unknown as { _langs: Record<string, number> })._langs).map(([l,q])=>`${l} x${q}`).join(', ')})`
                  : ''}
              </td>
              <td className="px-4 py-3 text-zinc-300">{c.condition ?? '—'}</td>
              <td className="px-4 py-3 text-zinc-300">x{(c as unknown as { _total?: number })._total ?? c.quantity}</td>
              <td className="px-4 py-3 text-right font-medium text-amber-400">{formatPrice(c.price_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
