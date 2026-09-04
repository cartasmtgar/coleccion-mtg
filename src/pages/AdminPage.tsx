import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LogOut, Plus, RefreshCw, Loader2, Sparkles, ExternalLink, LayoutDashboard, AlertTriangle, ArrowUp, ArrowDown, GripVertical, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { SearchFilters } from '../components/public/SearchFilters'
import { AdminTable } from '../components/admin/AdminTable'
import { CardForm } from '../components/admin/CardForm'
import { CardDetail } from '../components/public/CardDetail'
import { CardGrid } from '../components/public/CardGrid'
import { Modal } from '../components/ui/Modal'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Input'
import { useCards } from '../hooks/useCards'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_FILTERS, type CardFilters, type CatalogView } from '../types/filters'
import type { Card } from '../types/card'
import type { ScryfallCard } from '../types/scryfall'
import { fetchByScryfallId, searchScryfallExact, bulkFetchCollection, getScryfallImage, getScryfallPrice } from '../services/scryfall'
import { editionToSetCode, getCanonicalEnglishName, normalizeForCompare } from '../lib/mtg-sets'
import { applySort, removeRule, toggleDir, type SortRule } from '../lib/sort'
import * as cardsService from '../services/cards.service'

export function AdminPage() {
  const { cards, refresh } = useCards()
  const { signOut, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const syncFilter = searchParams.get('sync') as 'synced' | 'pending' | null
  const [catalogView, setCatalogView] = useState<CatalogView>('table')
  const [filters, setFilters] = useState<CardFilters>(DEFAULT_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null)
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [detailScryfall, setDetailScryfall] = useState<ScryfallCard | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [sortRules, setSortRules] = useState<SortRule<import('../components/admin/AdminTable').AdminSortField>[]>(() => {
    try {
      const raw = localStorage.getItem('admin:sort')
      return raw ? (JSON.parse(raw) as SortRule<import('../components/admin/AdminTable').AdminSortField>[]) : []
    } catch {
      return []
    }
  })

  const editions = useMemo(() => [...new Set(cards.map((c) => c.edition).filter(Boolean) as string[])].sort(), [cards])
  const owners = useMemo(() => [...new Set(cards.map((c) => c.owner).filter(Boolean) as string[])].sort(), [cards])

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (syncFilter === 'synced' && !(c.image_url || c.scryfall_id)) return false
      if (syncFilter === 'pending' && (c.image_url || c.scryfall_id)) return false
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
  }, [cards, filters, syncFilter])

  const sorted = useMemo(() => applySort(filtered as unknown as import('../types/card').Card[], sortRules as SortRule[]) as typeof filtered, [filtered, sortRules])

  const paginated = useMemo(() => {
    const start = page * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize])

  useEffect(() => {
    setPage(0)
  }, [filters, pageSize, syncFilter, sortRules])

  useEffect(() => {
    try {
      localStorage.setItem('admin:sort', JSON.stringify(sortRules))
    } catch {}
  }, [sortRules])

  // Inicializa filtros desde query params del dashboard (?owner=Pollo&rarity=rare etc.)
  useEffect(() => {
    const owner = searchParams.get('owner')
    const rarity = searchParams.get('rarity')
    const language = searchParams.get('language')
    const edition = searchParams.get('edition')
    const type = searchParams.get('type')
    const color = searchParams.get('color')
    if (owner || rarity || language || edition || type || color) {
      setFilters(f => ({
        ...f,
        owner: owner ?? f.owner,
        rarity: rarity ?? f.rarity,
        language: language ?? f.language,
        edition: edition ?? f.edition,
        type: type ?? f.type,
        color: color ?? f.color,
      }))
    }
  }, []) // solo al montar, para links desde dashboard

  const handleSync = async (card: Card) => {
    setSyncingId(card.id)
    try {
      // Siempre busca por nombre+edición para corregir ediciones erróneas previas (no usa scryfall_id cacheado)
      const sc = await searchScryfallExact(card.name_en || card.name_es, card.edition, card.language, card.goldfish_url)
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
    // Usa filtrado actual si hay filtros activos, si no todo - siempre re-resuelve por nombre+edición para corregir ediciones erróneas
    const toSync = filtered.length > 0 && filtered.length < cards.length ? filtered : cards
    // Dedup por nombre canónico + set (usa helper que corrige columnas invertidas y sufijos de artista) - normalizado para acentos/apóstrofes
    const keyToCards = new Map<string, Card[]>()
    for (const c of toSync) {
      const set = editionToSetCode(c.edition)
      const canonical = normalizeForCompare(getCanonicalEnglishName(c) || c.name_en || c.name_es || '')
      const key = `${canonical}|${set ?? ''}`
      const arr = keyToCards.get(key) ?? []
      arr.push(c)
      keyToCards.set(key, arr)
    }

    const uniqueIdentifiers = [...keyToCards.entries()].map(([key]) => {
      const [, set] = key.split('|')
      const sample = keyToCards.get(key)![0]
      const originalName = getCanonicalEnglishName(sample) || sample.name_en || sample.name_es || ''
      return set ? { name: originalName, set } : { name: originalName }
    })

    setSyncingAll(true)
    setSyncProgress({ done: 0, total: toSync.length })

    // Sync por name+set en bulk (75 máx por request) - corrige ediciones previas erróneas
    // Ya no separara por idCards; todos se re-resuelven por nombre+set
    const BATCH = 75
    for (let i = 0; i < uniqueIdentifiers.length; i += BATCH) {
      const batchIds = uniqueIdentifiers.slice(i, i + BATCH)
      try {
        const { data } = await bulkFetchCollection(batchIds)
        // mapear respuesta a key - normalizado para acentos/apóstrofes (Man-o-War vs Man-o'-War, Ghazban vs Ghazbán)
        const scByKey = new Map<string, ScryfallCard>()
        for (const sc of data) {
          const k = `${normalizeForCompare(sc.name)}|${sc.set}`
          scByKey.set(k, sc)
          if (!scByKey.has(normalizeForCompare(sc.name) + '|')) scByKey.set(normalizeForCompare(sc.name) + '|', sc)
        }
        for (const ident of batchIds) {
          const nameKey = `${normalizeForCompare(ident.name!)}|${ident.set ?? ''}`
          const sc = scByKey.get(nameKey) ?? scByKey.get(normalizeForCompare(ident.name!) + '|')
          const cardsForKey = keyToCards.get(nameKey) ?? []
          if (sc) {
            for (const card of cardsForKey) {
              setSyncingId(card.id)
              await cardsService.syncCardWithScryfall(card, { id: sc.id, uri: sc.scryfall_uri, image: getScryfallImage(sc), price: getScryfallPrice(sc) })
              setSyncProgress(p => (p ? { done: p.done + 1, total: p.total } : p))
            }
          } else {
            // no encontrado, avanzar contador
            for (const _card of cardsForKey) setSyncProgress(p => (p ? { done: p.done + 1, total: p.total } : p))
          }
        }
      } catch {
        // fallback a individual exact si bulk falla
        for (const ident of batchIds) {
          const cardsForKey = keyToCards.get(`${ident.name!.toLowerCase()}|${ident.set ?? ''}`) ?? []
          for (const card of cardsForKey) {
            try {
              const sc = await searchScryfallExact(card.name_en || card.name_es, card.edition, card.language, card.goldfish_url)
              if (sc) await cardsService.syncCardWithScryfall(card, { id: sc.id, uri: sc.scryfall_uri, image: getScryfallImage(sc), price: getScryfallPrice(sc) })
            } catch { /* ignore */ }
            setSyncProgress(p => (p ? { done: p.done + 1, total: p.total } : p))
          }
        }
      }
    }

    setSyncingId(null)
    setSyncingAll(false)
    setSyncProgress(null)
    await refresh()
  }

  const handleSave = async (payload: Omit<Card, 'id' | 'created_at'>) => {
    if (editing) await cardsService.updateCard(editing.id, payload)
    else await cardsService.createCard(payload)
    await refresh()
    setEditing(null)
  }

  const handleDelete = (id: string) => {
    const card = cards.find(c => c.id === id)
    if (card) setDeleteTarget(card)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await cardsService.deleteCard(deleteTarget.id)
    await refresh()
    setDeleteTarget(null)
  }

  const handleView = async (card: Card) => {
    setDetailCard(card)
    setDetailScryfall(null)
    if (card.scryfall_id) {
      try {
        const sc = await fetchByScryfallId(card.scryfall_id)
        setDetailScryfall(sc)
      } catch { /* ignore */ }
    } else if (card.image_url) {
      // ya tiene imagen, no necesita fetch extra
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
              <h1 className="text-sm font-bold leading-none text-white">Panel Admin</h1>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/dashboard" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/admin/scryfall" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white">
              <Sparkles size={16} /> Docs Scryfall
            </Link>
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-1">
              <ExternalLink size={16} /> Catálogo
            </a>
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
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleSyncAll} disabled={syncingAll}>
                {syncingAll ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {syncingAll ? `Sincronizando ${syncProgress ? `${syncProgress.done}/${syncProgress.total}` : '...'}` : `Sincronizar ${filtered.length < cards.length ? `filtradas (${filtered.length})` : 'todo'}`}
              </Button>
              <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
                <Plus size={16} /> Agregar Nueva Carta
              </Button>
            </div>
            {syncProgress && (
              <div className="h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.round((syncProgress.done / syncProgress.total) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>

        {syncFilter && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-700/30 bg-amber-950/20 px-3 py-2 text-sm">
            <span className="text-amber-300">
              Filtrado por: {syncFilter === 'synced' ? 'con imagen' : 'pendientes'} ({filtered.length})
            </span>
            <button onClick={() => setSearchParams({})} className="ml-auto text-xs text-zinc-400 hover:text-white underline">
              Limpiar filtro
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500 pt-1">Filtrar sincronización:</span>
          <button
            onClick={() => setSearchParams(syncFilter === 'synced' ? {} : { sync: 'synced' })}
            className={`rounded-full px-3 py-1 text-xs font-medium border ${syncFilter === 'synced' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
          >
            Con imagen
          </button>
          <button
            onClick={() => setSearchParams(syncFilter === 'pending' ? {} : { sync: 'pending' })}
            className={`rounded-full px-3 py-1 text-xs font-medium border ${syncFilter === 'pending' ? 'bg-amber-600 text-white border-amber-500' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
          >
            Pendientes
          </button>
        </div>

        <SearchFilters filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} view={catalogView} onViewChange={setCatalogView} editions={editions} owners={owners} />

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-2 py-2">
          <span className="text-xs font-medium text-zinc-400">Ordenar por (máx 3):</span>
          {sortRules.map((r, idx) => (
            <div
              key={r.field}
              draggable={sortRules.length > 1}
              onDragStart={e => { if (sortRules.length <= 1) { e.preventDefault(); return } e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed = 'move' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const from = Number(e.dataTransfer.getData('text/plain'))
                if (Number.isNaN(from) || from === idx) return
                const copy = [...sortRules]
                const [moved] = copy.splice(from, 1)
                copy.splice(idx, 0, moved)
                setSortRules(copy)
              }}
              className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-1.5 py-1"
            >
              <span className={`flex h-6 w-5 items-center justify-center rounded-md ${sortRules.length > 1 ? 'cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300' : 'cursor-not-allowed text-zinc-600 opacity-40'}`} title={sortRules.length > 1 ? 'Arrastrar para reordenar' : 'Añade otro orden para reordenar'}>
                <GripVertical size={12} />
              </span>
              <Select value={r.field} onChange={e => { const v = e.target.value as import('../components/admin/AdminTable').AdminSortField; const copy = [...sortRules]; copy[idx] = { field: v, dir: r.dir }; setSortRules(copy) }} className="!w-20 shrink-0 py-1 text-xs border-0 bg-transparent p-0">
                  <option value="name">Nombre</option>
                  <option value="edition">Edición</option>
                  <option value="owner">Dueño</option>
                  <option value="condition">Condición</option>
                  <option value="quantity">Cantidad</option>
                  <option value="price">Precio u.</option>
                </Select>
              <div className="flex min-w-[56px] shrink-0 overflow-hidden rounded-md border border-zinc-700">
                <button onClick={() => setSortRules(toggleDir(sortRules, r.field, 'asc'))} className={`flex-1 flex items-center justify-center p-1 ${r.dir === 'asc' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`} aria-label="Ascendente"><ArrowUp size={12} className="shrink-0" /></button>
                <button onClick={() => setSortRules(toggleDir(sortRules, r.field, 'desc'))} className={`flex-1 flex items-center justify-center p-1 ${r.dir === 'desc' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`} aria-label="Descendente"><ArrowDown size={12} className="shrink-0" /></button>
              </div>
              <button onClick={() => setSortRules(removeRule(sortRules, r.field))} className="ml-1 text-zinc-500 hover:text-white"><X size={12} /></button>
            </div>
          ))}
            {sortRules.length < 3 && (
              <Select value="" onChange={e => { const v = e.target.value as import('../components/admin/AdminTable').AdminSortField; if (v && !sortRules.find(x => x.field === v)) setSortRules([...sortRules, { field: v, dir: 'asc' }]) }} className="!w-24 shrink-0 py-1 text-xs">
                <option value="">+ Añadir</option>
                <option value="name">Nombre</option>
                <option value="edition">Edición</option>
                <option value="owner">Dueño</option>
                <option value="condition">Condición</option>
                <option value="quantity">Cantidad</option>
                <option value="price">Precio u.</option>
              </Select>
            )}
            {sortRules.length > 0 && <button onClick={() => setSortRules([])} className="text-xs text-zinc-500 hover:text-white underline">Limpiar</button>}
          </div>

        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
        {catalogView === 'grid' ? (
          <CardGrid cards={paginated} onSelect={handleView} />
        ) : (
          <AdminTable cards={paginated} onEdit={(c) => { setEditing(c); setFormOpen(true) }} onDelete={handleDelete} onSync={handleSync} onView={handleView} syncingId={syncingId} />
        )}
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />

        <CardForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }} initial={editing} onSave={handleSave} />
        <CardDetail card={detailCard} scryfall={detailScryfall} open={!!detailCard} onClose={() => setDetailCard(null)} />

        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar carta">
          {deleteTarget && (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-red-900/40 bg-red-950/30 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
                <div className="text-sm">
                  <p className="font-medium text-white">¿Eliminar "{deleteTarget.name_en ?? deleteTarget.name_es}"?</p>
                  <p className="mt-1 text-zinc-400">
                    Edición {deleteTarget.edition ?? '—'} · {deleteTarget.owner ?? '—'} · x{deleteTarget.quantity}. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                <Button variant="danger" onClick={handleConfirmDelete}>Eliminar</Button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  )
}
