import { Pencil, Trash2, RefreshCw, Loader2, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'
import type { SortRule } from '../../lib/sort'

export type AdminSortField = 'name' | 'edition' | 'owner' | 'condition' | 'quantity' | 'price'
export type SortDir = 'asc' | 'desc'

interface Props {
  cards: Card[]
  onEdit: (c: Card) => void
  onDelete: (id: string) => void
  onSync: (c: Card) => void
  onView: (c: Card) => void
  syncingId: string | null
  sortRules: SortRule<AdminSortField>[]
  onSort: (field: AdminSortField, e?: React.MouseEvent) => void
}

export function AdminTable({ cards, onEdit, onDelete, onSync, onView, syncingId, sortRules, onSort }: Props) {
  const getRule = (field: AdminSortField) => sortRules.find(r => r.field === field)
  const SortIcon = ({ field }: { field: AdminSortField }) => {
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
    return <p className="py-10 text-center text-zinc-500">Sin cartas. Agrega la primera.</p>
  }

  return (
    <div className="overflow-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
          <tr>
            <th className="px-3 py-3"><button onClick={e => onSort('name', e)} className={thCls}>Nombre <SortIcon field="name" /></button></th>
            <th className="px-3 py-3"><button onClick={e => onSort('edition', e)} className={thCls}>Edición <SortIcon field="edition" /></button></th>
            <th className="px-3 py-3"><button onClick={e => onSort('owner', e)} className={thCls}>Dueño <SortIcon field="owner" /></button></th>
            <th className="px-3 py-3"><button onClick={e => onSort('condition', e)} className={thCls}>Cond. <SortIcon field="condition" /></button></th>
            <th className="px-3 py-3"><button onClick={e => onSort('quantity', e)} className={thCls}>Cant. <SortIcon field="quantity" /></button></th>
            <th className="px-3 py-3 text-right"><button onClick={e => onSort('price', e)} className={`${thCls} ml-auto`}>Precio <SortIcon field="price" /></button></th>
            <th className="px-3 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-950">
          {cards.map((c) => (
            <tr key={c.id} onClick={() => onView(c)} className="hover:bg-zinc-900 cursor-pointer">
              <td className="px-3 py-3">
                <div className="font-medium text-white">{c.name_en ?? c.name_es}</div>
                <div className="text-xs text-zinc-500">{c.name_en && c.name_es && c.name_en !== c.name_es ? c.name_es : '—'} · {c.language}</div>
              </td>
              <td className="px-3 py-3 text-zinc-300">{c.edition ?? '—'}</td>
              <td className="px-3 py-3 text-zinc-300">{c.owner ?? '—'}</td>
              <td className="px-3 py-3 text-zinc-300">{c.condition ?? '—'}</td>
              <td className="px-3 py-3 text-zinc-300">x{c.quantity}</td>
              <td className="px-3 py-3 text-right text-amber-400">{formatPrice(c.price_usd)}</td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(c) }} aria-label="Ver detalle" title="Ver detalle" className="h-9 w-9 p-0">
                    <Eye size={20} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onSync(c) }}
                    disabled={syncingId === c.id}
                    aria-label={`Sincronizar ${c.name_en ?? c.name_es}`}
                    title="Sincronizar con Scryfall"
                    className="h-9 w-9 p-0"
                  >
                    {syncingId === c.id ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(c) }} aria-label="Editar" title="Editar carta" className="h-9 w-9 p-0">
                    <Pencil size={20} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(c.id) }} aria-label="Eliminar" title="Eliminar carta" className="h-9 w-9 p-0 !text-red-500 hover:!text-red-400 hover:bg-red-950/30">
                    <Trash2 size={20} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
