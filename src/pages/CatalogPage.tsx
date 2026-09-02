import { useEffect, useMemo, useState } from 'react'
import { Mail, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SearchFilters } from '../components/public/SearchFilters'
import { CardGrid } from '../components/public/CardGrid'
import { CardTable } from '../components/public/CardTable'
import { CardDetail } from '../components/public/CardDetail'
import { ContactModal } from '../components/public/ContactModal'
import { Pagination } from '../components/ui/Pagination'
import { useCards } from '../hooks/useCards'
import { DEFAULT_FILTERS, type CardFilters, type CatalogView } from '../types/filters'
import type { Card } from '../types/card'
import type { ScryfallCard } from '../types/scryfall'
import { fetchByScryfallId } from '../services/scryfall'
import { isSupabaseConfigured } from '../lib/supabase'

export function CatalogPage() {
  const { cards, loading, error } = useCards()
  const [catalogView, setCatalogView] = useState<CatalogView>('grid')
  const [filters, setFilters] = useState<CardFilters>(DEFAULT_FILTERS)
  const [contactOpen, setContactOpen] = useState(false)
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [detailScryfall, setDetailScryfall] = useState<ScryfallCard | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

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

  const paginated = useMemo(() => {
    const start = page * pageSize
    return grouped.slice(start, start + pageSize)
  }, [grouped, page, pageSize])

  useEffect(() => {
    setPage(0)
  }, [filters, pageSize])

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

            <Pagination page={page} pageSize={pageSize} total={grouped.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
            {catalogView === 'grid' ? (
              <CardGrid cards={paginated} onSelect={handleSelect} />
            ) : (
              <CardTable cards={paginated} onSelect={handleSelect} />
            )}
            <Pagination page={page} pageSize={pageSize} total={grouped.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
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
