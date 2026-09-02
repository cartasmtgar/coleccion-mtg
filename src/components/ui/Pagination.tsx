import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select } from './Input'

interface Props {
  page: number // 0-indexed
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-3 text-sm">
      <div className="flex items-center gap-2 text-zinc-400">
        <span>
          Mostrando {start}-{end} de {total}
        </span>
        <span className="hidden sm:inline text-zinc-600">|</span>
        <label className="flex items-center gap-1.5">
          <span className="text-xs">Filas:</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value))
              onPageChange(0)
            }}
            className="w-20 py-1 text-xs"
            aria-label="Filas por página"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
          </Select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} /> Anterior
        </button>

        <span className="px-3 text-xs text-zinc-500">
          Página {page + 1} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
