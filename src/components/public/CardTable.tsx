import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'
import type { SortRule } from '../../lib/sort'

export type CatalogSortField = 'name' | 'edition' | 'rarity' | 'language' | 'condition' | 'quantity' | 'price'
export type CatalogSortDir = 'asc' | 'desc'

export function CardTable({ cards, onSelect, sortRules, onSort }: { cards: (Card & { _total?: number; _langs?: Record<string, number> })[]; onSelect: (c: Card) => void; sortRules: SortRule<CatalogSortField>[]; onSort: (f: CatalogSortField, e?: React.MouseEvent) => void }) {
  const getRule = (field: CatalogSortField) => sortRules.find(r => r.field === field)
  const SortIcon = ({ field }: { field: CatalogSortField }) => {
    const rule = getRule(field)
    if (!rule) return <ArrowUpDown size={14} className="opacity-40" />
    const idx = sortRules.findIndex(r => r.field === field)
    return (
      <span className="inline-flex items-center gap-1">
        {rule.dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {sortRules.length > 1 && <span className="text-[10px] font-bold text-amber-400">{idx + 1}</span>}
      </span>
    )
  }
  const thCls = 'inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-white transition uppercase tracking-wider'
  if (cards.length === 0) {
    return <p className="py-12 text-center text-zinc-500">No hay resultados.</p>
  }
  return (
    <div className="overflow-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
          <tr>
            <th className="px-4 py-3"><button onClick={e => onSort('name', e)} className={thCls}>Nombre <SortIcon field="name" /></button></th>
            <th className="px-4 py-3"><button onClick={e => onSort('edition', e)} className={thCls}>Edición <SortIcon field="edition" /></button></th>
            <th className="px-4 py-3"><button onClick={e => onSort('rarity', e)} className={thCls}>Rareza <SortIcon field="rarity" /></button></th>
            <th className="px-4 py-3"><button onClick={e => onSort('language', e)} className={thCls}>Idioma <SortIcon field="language" /></button></th>
            <th className="px-4 py-3"><button onClick={e => onSort('condition', e)} className={thCls}>Cond. <SortIcon field="condition" /></button></th>
            <th className="px-4 py-3"><button onClick={e => onSort('quantity', e)} className={thCls}>Cant. <SortIcon field="quantity" /></button></th>
            <th className="px-4 py-3 text-right"><button onClick={e => onSort('price', e)} className={`${thCls} ml-auto`}>Precio u. <SortIcon field="price" /></button></th>
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
              <td className="px-4 py-3 text-zinc-300">{c.rarity ? c.rarity.charAt(0).toUpperCase() + c.rarity.slice(1) : '—'}</td>
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
