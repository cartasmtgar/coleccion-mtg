import { useMemo, useState } from 'react'
import { Layers, Shield, Mail, Plus, RefreshCw, Loader2, Sparkles } from 'lucide-react'
import { Button } from './components/ui/Button'
import { SearchFilters } from './components/public/SearchFilters'
import { CardGrid } from './components/public/CardGrid'
import { CardTable } from './components/public/CardTable'
import { CardDetail } from './components/public/CardDetail'
import { ContactModal } from './components/public/ContactModal'
import { AdminTable } from './components/admin/AdminTable'
import { CardForm } from './components/admin/CardForm'
import { useCards } from './hooks/useCards'
import { DEFAULT_FILTERS, type CardFilters, type CatalogView, type AppView } from './types/filters'
import type { Card } from './types/card'
import type { ScryfallCard } from './types/scryfall'
import { fetchByScryfallId, searchScryfall, getScryfallImage, getScryfallPrice } from './services/scryfall'
import * as cardsService from './services/cards.service'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const { cards, loading, error, refresh } = useCards()

  const [appView, setAppView] = useState<AppView>('catalog')
  const [catalogView, setCatalogView] = useState<CatalogView>('grid')
  const [filters, setFilters] = useState<CardFilters>(DEFAULT_FILTERS)

  const [contactOpen, setContactOpen] = useState(false)
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [detailScryfall, setDetailScryfall] = useState<ScryfallCard | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)

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
      if (filters.condition && c.condition !== filters.condition) return false
      if (filters.owner && c.owner !== filters.owner) return false
      if (filters.type && c.type && !c.type.toLowerCase().includes(filters.type.toLowerCase())) return false
      return true
    })
  }, [cards, filters])

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

  const handleSync = async (card: Card) => {
    setSyncingId(card.id)
    try {
      let sc: ScryfallCard | null = null
      if (card.scryfall_id) sc = await fetchByScryfallId(card.scryfall_id)
      else sc = await searchScryfall(card.name_en ?? card.name_es)
      if (!sc) throw new Error('No se encontró en Scryfall')
      const image = getScryfallImage(sc)
      const price = getScryfallPrice(sc)
      await cardsService.syncCardWithScryfall(card, { id: sc.id, uri: sc.scryfall_uri, image, price })
      await refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error sincronizando')
    } finally {
      setSyncingId(null)
    }
  }

  const handleSyncAll = async () => {
    setSyncingAll(true)
    for (const card of cards) {
      setSyncingId(card.id)
      try {
        let sc: ScryfallCard | null = null
        if (card.scryfall_id) sc = await fetchByScryfallId(card.scryfall_id)
        else sc = await searchScryfall(card.name_en ?? card.name_es)
        if (sc) {
          await cardsService.syncCardWithScryfall(card, {
            id: sc.id,
            uri: sc.scryfall_uri,
            image: getScryfallImage(sc),
            price: getScryfallPrice(sc),
          })
        }
      } catch {
        // continue
      }
    }
    setSyncingId(null)
    setSyncingAll(false)
    await refresh()
  }

  const handleSave = async (payload: Omit<Card, 'id' | 'created_at'>) => {
    if (editing) {
      await cardsService.updateCard(editing.id, payload)
    } else {
      await cardsService.createCard(payload)
    }
    await refresh()
    setEditing(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta carta?')) return
    await cardsService.deleteCard(id)
    await refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-zinc-900">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none text-white">Colección MTG</h1>
              <p className="text-xs text-zinc-500">Catálogo + Admin · Scryfall</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Button
              variant={appView === 'catalog' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setAppView('catalog')}
            >
              <Layers size={16} /> Catálogo
            </Button>
            <Button
              variant={appView === 'admin' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setAppView('admin')}
            >
              <Shield size={16} /> Administración
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setContactOpen(true)}>
              <Mail size={16} /> Contacto
            </Button>
          </nav>
        </div>
      </header>

      {/* Supabase warning */}
      {!isSupabaseConfigured && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 px-4 py-2 text-sm text-amber-300">
            Modo mock activo — configura <code className="rounded bg-zinc-900 px-1">VITE_SUPABASE_URL</code> y <code className="rounded bg-zinc-900 px-1">VITE_SUPABASE_ANON_KEY</code> en <code className="rounded bg-zinc-900 px-1">.env</code> y ejecuta <code className="rounded bg-zinc-900 px-1">supabase/schema.sql</code> para usar datos reales.
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        {loading && <p className="py-10 text-center text-zinc-500">Cargando colección...</p>}
        {error && <p className="py-6 text-center text-red-400">{error}</p>}

        {!loading && !error && appView === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">Catálogo Público</h2>
                <p className="text-sm text-zinc-500">{filtered.length} cartas · Vista sin carrito, solo exhibición y cotización</p>
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
            />

            {catalogView === 'grid' ? (
              <CardGrid cards={filtered} onSelect={handleSelect} />
            ) : (
              <CardTable cards={filtered} onSelect={handleSelect} />
            )}
          </div>
        )}

        {!loading && !error && appView === 'admin' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-white">Panel de Administración</h2>
                <p className="text-sm text-zinc-500">CRUD completo · Dueño, condición, idioma, cantidad y notas privadas</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleSyncAll} disabled={syncingAll}>
                  {syncingAll ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {syncingAll ? 'Sincronizando...' : 'Sincronizar todo (Scryfall)'}
                </Button>
                <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                  <Plus size={16} /> Agregar Nueva Carta
                </Button>
              </div>
            </div>

            {/* Admin filters — reuse same but hide color? */}
            <SearchFilters
              filters={filters}
              onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
              view={catalogView}
              onViewChange={setCatalogView}
              editions={editions}
              owners={owners}
            />

            <AdminTable
              cards={filtered}
              onEdit={(c) => { setEditing(c); setFormOpen(true) }}
              onDelete={handleDelete}
              onSync={handleSync}
              syncingId={syncingId}
            />

            <CardForm
              open={formOpen}
              onClose={() => { setFormOpen(false); setEditing(null) }}
              initial={editing}
              onSave={handleSave}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-600">
        Colección MTG Web + Admin · Datos enriquecidos con Scryfall API · Deploy Netlify · {new Date().getFullYear()}
      </footer>

      <CardDetail
        card={detailCard}
        scryfall={detailScryfall}
        open={!!detailCard}
        onClose={() => setDetailCard(null)}
      />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
