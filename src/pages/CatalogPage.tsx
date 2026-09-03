import { useEffect, useMemo, useState } from 'react'
import { Mail, Sparkles, X, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SearchFilters } from '../components/public/SearchFilters'
import { CardGrid } from '../components/public/CardGrid'
import { CardTable, type CatalogSortField } from '../components/public/CardTable'
import { CardDetail } from '../components/public/CardDetail'
import { ContactModal } from '../components/public/ContactModal'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Input'
import { useCards } from '../hooks/useCards'
import { DEFAULT_FILTERS, type CardFilters, type CatalogView } from '../types/filters'
import type { Card } from '../types/card'
import type { ScryfallCard } from '../types/scryfall'
import { fetchByScryfallId } from '../services/scryfall'
import { isSupabaseConfigured } from '../lib/supabase'
import { applySort, removeRule, toggleDir, upsertRule, type SortRule } from '../lib/sort'

export function CatalogPage() {
  const { cards, loading, error } = useCards()
  const [catalogView, setCatalogView] = useState<CatalogView>('grid')
  const [filters, setFilters] = useState<CardFilters>(DEFAULT_FILTERS)
  const [contactOpen, setContactOpen] = useState(false)
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [detailScryfall, setDetailScryfall] = useState<ScryfallCard | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [sortRules, setSortRules] = useState<SortRule<CatalogSortField>[]>(() => {
    try {
      const raw = localStorage.getItem('catalog:sort')
      return raw ? (JSON.parse(raw) as SortRule<CatalogSortField>[]) : []
    } catch {
      return []
    }
  })

  const editions = useMemo(() => [...new Set(cards.map((c) => c.edition).filter(Boolean) as string[])].sort(), [cards])
  const owners = useMemo(() => [...new Set(cards.map((c) => c.owner).filter(Boolean) as string[])].sort(), [cards])

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const hay = `${c.name_es} ${c.name_en ?? ''} ${c.type ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.edition && c.edition !== filters.edition) return false
      if (filters.rarity && c.rarity !== filters.rarity) return false
      if (filters.language && c.language !== filters.language) return false
      if (filters.color && c.type !== filters.color) return false
      if (filters.condition && c.condition !== filters.condition) return false
      if (filters.owner && c.owner !== filters.owner) return false
      if (filters.type && c.type && !c.type.toLowerCase().includes(filters.type.toLowerCase())) return false
      return true
    })
  }, [cards, filters])

  // Agrupar por goldfish_url para mostrar total + desglose por idioma (B)
  // Agrupar por goldfish_url para mostrar total + desglose por idioma (B)
  const grouped = useMemo(() => {
    const map = new Map<string, { rep: Card; total: number; langs: Record<string, number> }>()
    for (const c of filtered) {
      const key = c.goldfish_url ? c.goldfish_url : `${c.name_es}||${c.name_en}||${c.edition}||${c.type}`
      const entry = map.get(key)
      if (entry) {
        entry.total += c.quantity
        entry.langs[c.language] = (entry.langs[c.language] ?? 0) + c.quantity
      } else {
        map.set(key, { rep: c, total: c.quantity, langs: { [c.language]: c.quantity } })
      }
    }
    return [...map.values()].map(v => ({ ...v.rep, quantity: v.total, _total: v.total, _langs: v.langs } as Card & { _total: number; _langs: Record<string, number> }))
  }, [filtered])

  const sorted = useMemo(() => applySort(grouped as unknown as import('../types/card').Card[], sortRules as SortRule[]) as typeof grouped, [grouped, sortRules])

  const paginated = useMemo(() => {
    const start = page * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  useEffect(() => {
    setPage(0)
  }, [filters, pageSize, sortRules])

  useEffect(() => {
    try {
      localStorage.setItem('catalog:sort', JSON.stringify(sortRules))
    } catch {}
  }, [sortRules])

  const handleSort = (field: CatalogSortField, e?: React.MouseEvent) => {
    // Shift+click añade, click normal reemplaza (manteniendo compatibilidad)
    const isMulti = e?.shiftKey
    if (isMulti) setSortRules(r => upsertRule(r, field))
    else setSortRules(r => {
      const existing = r.find(x => x.field === field)
      if (existing) return [{ field, dir: existing.dir === 'asc' ? 'desc' : 'asc' }]
      return [{ field, dir: 'asc' }]
    })
  }

  const handleAddRule = (field: CatalogSortField) => {
    if (!field) return
    setSortRules(r => (r.find(x => x.field === field) ? r : [...r, { field, dir: 'asc' as const }].slice(0, 3)))
  }

  const handleSelect = async (card: Card) => {
    setDetailCard(card)
    setDetailScryfall(null)
    if (card.scryfall_id) {
      try {
        const sc = await fetchByScryfallId(card.scryfall_id)
        setDetailScryfall(sc)
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-zinc-900">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none text-white">Colección MTG</h1>
              <p className="text-xs text-zinc-500">Catálogo público · Scryfall</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setContactOpen(true)}>
            <Mail size={16} /> Contacto
          </Button>
        </div>
      </header>

      {!isSupabaseConfigured && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2 text-sm text-amber-300">
            Modo mock activo — configura <code className="rounded bg-zinc-900 px-1">VITE_SUPABASE_URL</code> y{' '}
            <code className="rounded bg-zinc-900 px-1">VITE_SUPABASE_ANON_KEY</code> en <code className="rounded bg-zinc-900 px-1">.env</code>.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        {loading && <p className="py-10 text-center text-zinc-500">Cargando colección...</p>}
        {error && <p className="py-6 text-center text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">Catálogo</h2>
                <p className="text-sm text-zinc-500">{grouped.length} cartas únicas · {filtered.reduce((a,c)=>a+c.quantity,0)} unidades totales</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setContactOpen(true)}>
                <Mail size={14} /> Cotizar cartas
              </Button>
            </div>

            <SearchFilters
              filters={filters}
              onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
              view={catalogView}
              onViewChange={setCatalogView}
              editions={editions}
              owners={owners}
              hideOwner
            />

            {catalogView === 'grid' && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5">
                <span className="text-xs font-medium text-zinc-400">Ordenar por (máx 3):</span>
                {sortRules.map((r, idx) => (
                  <div key={r.field} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5">
                    <span className="text-xs font-bold text-amber-400">{idx + 1}</span>
                    <Select value={r.field} onChange={e => { const v = e.target.value as CatalogSortField; const copy = [...sortRules]; copy[idx] = { field: v, dir: r.dir }; setSortRules(copy) }} className="w-24 py-1 text-xs border-0 bg-transparent p-0">
                      <option value="name">Nombre</option>
                      <option value="edition">Edición</option>
                      <option value="rarity">Rareza</option>
                      <option value="language">Idioma</option>
                      <option value="condition">Condición</option>
                      <option value="quantity">Cantidad</option>
                      <option value="price">Precio u.</option>
                    </Select>
                    <div className="flex min-w-[64px] overflow-hidden rounded-md border border-zinc-700">
                      <button onClick={() => setSortRules(toggleDir(sortRules, r.field, 'asc'))} className={`flex-1 px-2.5 py-1.5 flex items-center justify-center ${r.dir === 'asc' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`} aria-label="Ascendente"><ArrowUp size={14} className="shrink-0" /></button>
                      <button onClick={() => setSortRules(toggleDir(sortRules, r.field, 'desc'))} className={`flex-1 px-2.5 py-1.5 flex items-center justify-center ${r.dir === 'desc' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`} aria-label="Descendente"><ArrowDown size={14} className="shrink-0" /></button>
                    </div>
                    <button onClick={() => setSortRules(removeRule(sortRules, r.field))} className="ml-1 text-zinc-500 hover:text-white"><X size={14} /></button>
                  </div>
                ))}
                {sortRules.length < 3 && (
                  <div className="flex items-center gap-1">
                    <Select value="" onChange={e => { const v = e.target.value as CatalogSortField; if (v) handleAddRule(v) }} className="w-32 py-1.5 text-xs">
                      <option value="">+ Añadir</option>
                      <option value="name">Nombre</option>
                      <option value="edition">Edición</option>
                      <option value="rarity">Rareza</option>
                      <option value="language">Idioma</option>
                      <option value="condition">Condición</option>
                      <option value="quantity">Cantidad</option>
                      <option value="price">Precio u.</option>
                    </Select>
                  </div>
                )}
                {sortRules.length > 0 && (
                  <button onClick={() => setSortRules([])} className="text-xs text-zinc-500 hover:text-white underline">Limpiar</button>
                )}
              </div>
            )}

            <Pagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
            {catalogView === 'grid' ? (
              <CardGrid cards={paginated} onSelect={handleSelect} />
            ) : (
              <CardTable cards={paginated} onSelect={handleSelect} sortRules={sortRules} onSort={handleSort} />
            )}
            <Pagination page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        Colección MTG · Datos enriquecidos con Scryfall API · {new Date().getFullYear()}
      </footer>

      <CardDetail card={detailCard} scryfall={detailScryfall} open={!!detailCard} onClose={() => setDetailCard(null)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
