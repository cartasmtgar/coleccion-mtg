import { Pencil, Trash2, RefreshCw, Loader2, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'

export type AdminSortField = 'name' | 'edition' | 'owner' | 'condition' | 'quantity' | 'price'
export type SortDir = 'asc' | 'desc'

interface Props {
  cards: Card[]
  onEdit: (c: Card) => void
  onDelete: (id: string) => void
  onSync: (c: Card) => void
  onView: (c: Card) => void
  syncingId: string | null
  sortBy: AdminSortField | null
  sortDir: SortDir
  onSort: (field: AdminSortField) => void
}

export function AdminTable({ cards, onEdit, onDelete, onSync, onView, syncingId, sortBy, sortDir, onSort }: Props) {
  const SortIcon = ({ field }: { field: AdminSortField }) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="opacity-40" />
    return sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }
  const thCls = 'px-3 py-3 cursor-pointer select-none hover:text-white transition inline-flex items-center gap-1'
  if (cards.length === 0) {
    return <p className="py-10 text-center text-zinc-500">Sin cartas. Agrega la primera.</p>
  }

  return (
    <div className="overflow-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
          <tr>
            <th className="px-3 py-3"><button onClick={() => onSort('name')} className={thCls}>Nombre <SortIcon field="name" /></button></th>
            <th className="px-3 py-3"><button onClick={() => onSort('edition')} className={thCls}>Edición <SortIcon field="edition" /></button></th>
            <th className="px-3 py-3"><button onClick={() => onSort('owner')} className={thCls}>Dueño <SortIcon field="owner" /></button></th>
            <th className="px-3 py-3"><button onClick={() => onSort('condition')} className={thCls}>Cond. <SortIcon field="condition" /></button></th>
            <th className="px-3 py-3"><button onClick={() => onSort('quantity')} className={thCls}>Cant. <SortIcon field="quantity" /></button></th>
            <th className="px-3 py-3 text-right"><button onClick={() => onSort('price')} className={`${thCls} ml-auto`}>Precio <SortIcon field="price" /></button></th>
            <th className="px-3 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800 bg-zinc-950">
          {cards.map((c) => (
            <tr key={c.id} className="hover:bg-zinc-900">
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
                  <Button variant="ghost" size="sm" onClick={() => onView(c)} aria-label="Ver detalle" title="Ver detalle" className="h-9 w-9 p-0">
                    <Eye size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSync(c)}
                    disabled={syncingId === c.id}
                    aria-label={`Sincronizar ${c.name_en ?? c.name_es}`}
                    title="Sincronizar con Scryfall"
                    className="h-9 w-9 p-0"
                  >
                    {syncingId === c.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(c)} aria-label="Editar" title="Editar carta" className="h-9 w-9 p-0">
                    <Pencil size={18} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)} aria-label="Eliminar" title="Eliminar carta" className="h-9 w-9 p-0 text-red-400 hover:text-red-300">
                    <Trash2 size={18} />
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
