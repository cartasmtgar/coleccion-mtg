import { Pencil, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatPrice } from '../../lib/utils'
import type { Card } from '../../types/card'

interface Props {
  cards: Card[]
  onEdit: (c: Card) => void
  onDelete: (id: string) => void
  onSync: (c: Card) => void
  syncingId: string | null
}

export function AdminTable({ cards, onEdit, onDelete, onSync, syncingId }: Props) {
  if (cards.length === 0) {
    return <p className="py-10 text-center text-zinc-500">Sin cartas. Agrega la primera.</p>
  }

  return (
    <div className="overflow-auto rounded-xl border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-xs uppercase text-zinc-400">
          <tr>
            <th className="px-3 py-3">Nombre</th>
            <th className="px-3 py-3">Edición</th>
            <th className="px-3 py-3">Dueño</th>
            <th className="px-3 py-3">Cond.</th>
            <th className="px-3 py-3">Cant.</th>
            <th className="px-3 py-3 text-right">Precio</th>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSync(c)}
                    disabled={syncingId === c.id}
                    aria-label={`Sincronizar ${c.name_en ?? c.name_es}`}
                    className="h-8 w-8 p-0"
                  >
                    {syncingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(c)} aria-label="Editar" className="h-8 w-8 p-0">
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)} aria-label="Eliminar" className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
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
