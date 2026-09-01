import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Plus, RefreshCw, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SearchFilters } from '../components/public/SearchFilters'
import { AdminTable } from '../components/admin/AdminTable'
import { CardForm } from '../components/admin/CardForm'
import { useCards } from '../hooks/useCards'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_FILTERS, type CardFilters, type CatalogView } from '../types/filters'
import type { Card } from '../types/card'
import type { ScryfallCard } from '../types/scryfall'
import { fetchByScryfallId, searchScryfall, getScryfallImage, getScryfallPrice } from '../services/scryfall'
import * as cardsService from '../services/cards.service'

export function AdminPage() {
  const { cards, refresh } = useCards()
  const { signOut, user } = useAuth()
  const [catalogView, setCatalogView] = useState<CatalogView>('grid')
  const [filters, setFilters] = useState<CardFilters>(DEFAULT_FILTERS)
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

  const handleSync = async (card: Card) => {
    setSyncingId(card.id)
    try {
      let sc: ScryfallCard | null = null
      if (card.scryfall_id) sc = await fetchByScryfallId(card.scryfall_id)
      else sc = await searchScryfall(card.name_en ?? card.name_es)
      if (!sc) throw new Error('No se encontró en Scryfall')
      await cardsService.syncCardWithScryfall(card, { id: sc.id, uri: sc.scryfall_uri, image: getScryfallImage(sc), price: getScryfallPrice(sc) })
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
          await cardsService.syncCardWithScryfall(card, { id: sc.id, uri: sc.scryfall_uri, image: getScryfallImage(sc), price: getScryfallPrice(sc) })
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
    if (editing) await cardsService.updateCard(editing.id, payload)
    else await cardsService.createCard(payload)
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
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-zinc-900">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none text-white">Panel Admin</h1>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-1">
              <ArrowLeft size={16} /> Catálogo
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={16} /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">Inventario</h2>
            <p className="text-sm text-zinc-500">{filtered.length} cartas · Ruta privada /admin</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleSyncAll} disabled={syncingAll}>
              {syncingAll ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {syncingAll ? 'Sincronizando...' : 'Sincronizar todo'}
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus size={16} /> Agregar Nueva Carta
            </Button>
          </div>
        </div>

        <SearchFilters filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} view={catalogView} onViewChange={setCatalogView} editions={editions} owners={owners} />

        <AdminTable cards={filtered} onEdit={(c) => { setEditing(c); setFormOpen(true) }} onDelete={handleDelete} onSync={handleSync} syncingId={syncingId} />

        <CardForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} initial={editing} onSave={handleSave} />
      </main>
    </div>
  )
}
