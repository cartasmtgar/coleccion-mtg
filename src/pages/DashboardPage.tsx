import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Package, Coins, Image as ImageIcon, Users, Sparkles, ArrowLeft, Trophy, TrendingUp, Globe, Shield, Boxes, Clock } from 'lucide-react'
import { useCards } from '../hooks/useCards'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../lib/utils'

export function DashboardPage() {
  const { cards } = useCards()
  const { user } = useAuth()

  const stats = useMemo(() => {
    const totalUnique = cards.length
    const totalUnits = cards.reduce((a, c) => a + c.quantity, 0)
    const uniqueGoldfish = new Set(cards.map(c => c.goldfish_url).filter(Boolean)).size
    const synced = cards.filter(c => c.scryfall_id || c.image_url).length
    const totalValue = cards.reduce((a, c) => a + (c.price_usd ?? 0) * c.quantity, 0)

    const byOwner = Object.entries(
      cards.reduce<Record<string, { units: number; rows: number; value: number }>>((acc, c) => {
        const o = c.owner ?? 'Sin dueño'
        if (!acc[o]) acc[o] = { units: 0, rows: 0, value: 0 }
        acc[o].units += c.quantity
        acc[o].rows += 1
        acc[o].value += (c.price_usd ?? 0) * c.quantity
        return acc
      }, {}),
    ).sort((a, b) => b[1].units - a[1].units)

    const byRarity = Object.entries(
      cards.reduce<Record<string, number>>((acc, c) => {
        const k = c.rarity ?? '—'
        acc[k] = (acc[k] ?? 0) + c.quantity
        return acc
      }, {}),
    ).sort((a, b) => b[1] - a[1])

    const byLang = Object.entries(
      cards.reduce<Record<string, number>>((acc, c) => {
        acc[c.language] = (acc[c.language] ?? 0) + c.quantity
        return acc
      }, {}),
    )

    const byEdition = Object.entries(
      cards.reduce<Record<string, number>>((acc, c) => {
        const k = c.edition ?? 'Sin edición'
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    const byType = Object.entries(
      cards.reduce<Record<string, number>>((acc, c) => {
        const k = c.type ?? 'Sin tipo'
        acc[k] = (acc[k] ?? 0) + c.quantity
        return acc
      }, {}),
    ).sort((a, b) => b[1] - a[1])

    const topExpensive = [...cards]
      .filter(c => c.price_usd != null)
      .sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0))
      .slice(0, 5)

    const recent = [...cards].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

    return { totalUnique, totalUnits, uniqueGoldfish, synced, totalValue, byOwner, byRarity, byLang, byEdition, byType, topExpensive, recent }
  }, [cards])

  const syncPct = stats.totalUnique ? Math.round((stats.synced / stats.totalUnique) * 100) : 0
  const maxEdition = Math.max(...stats.byEdition.map(([, v]) => v), 1)
  const maxRarity = Math.max(...stats.byRarity.map(([, v]) => v), 1)

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-900 shadow">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none text-white">Dashboard</h1>
              <p className="text-xs text-zinc-500">{user?.email} · Panel privado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800">
              <Boxes size={16} /> Inventario
            </Link>
            <Link to="/" target="_blank" className="text-sm text-zinc-400 hover:text-white inline-flex items-center gap-1">
              Catálogo <Globe size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Cartas únicas', value: stats.totalUnique, sub: `${stats.uniqueGoldfish} goldfish únicos`, icon: Layers, grad: 'from-amber-500 to-orange-600' },
            { label: 'Unidades totales', value: stats.totalUnits, sub: 'Suma de Q.', icon: Package, grad: 'from-violet-500 to-fuchsia-600' },
            { label: 'Valor estimado', value: formatPrice(stats.totalValue), sub: `${stats.synced} con precio`, icon: Coins, grad: 'from-emerald-500 to-teal-600' },
            { label: 'Sincronizadas', value: `${syncPct}%`, sub: `${stats.synced}/${stats.totalUnique} con imagen`, icon: ImageIcon, grad: 'from-sky-500 to-blue-600' },
          ].map(card => (
            <div key={card.label} className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-zinc-700">
              <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${card.grad} opacity-20 blur-2xl transition group-hover:opacity-30`} />
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.grad} text-white shadow`}>
                <card.icon size={18} />
              </div>
              <div className="mt-3 text-2xl font-bold text-white tracking-tight">{card.value}</div>
              <div className="text-sm font-medium text-zinc-300">{card.label}</div>
              <div className="text-xs text-zinc-500">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Owner + Sync */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Users size={16} className="text-amber-400" /> Distribución por dueño</h3>
            <div className="space-y-3">
              {stats.byOwner.map(([owner, d], i) => {
                const pct = Math.round((d.units / stats.totalUnits) * 100)
                const colors = ['bg-amber-500', 'bg-violet-500', 'bg-emerald-500', 'bg-sky-500']
                return (
                  <div key={owner} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-zinc-200">{owner}</span>
                      <span className="text-zinc-400">{d.rows} filas · {d.units} unidades · {formatPrice(d.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div className={`h-full ${colors[i % colors.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><TrendingUp size={16} className="text-emerald-400" /> Estado de sincronización</h3>
            <div className="flex items-center justify-center py-4">
              <div className="relative h-28 w-28">
                <div className="absolute inset-0 rounded-full border-8 border-zinc-800" />
                <div
                  className="absolute inset-0 rounded-full border-8 border-emerald-500 transition-all duration-1000"
                  style={{
                    clipPath: `inset(0 ${100 - syncPct}% 0 0)`,
                    transform: 'rotate(-90deg)',
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{syncPct}%</span>
                  <span className="text-xs text-zinc-500">sincronizadas</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-zinc-800 py-2"><div className="font-bold text-white">{stats.synced}</div><div className="text-zinc-500">con imagen</div></div>
              <div className="rounded-lg bg-zinc-800 py-2"><div className="font-bold text-amber-400">{stats.totalUnique - stats.synced}</div><div className="text-zinc-500">pendientes</div></div>
              <div className="rounded-lg bg-zinc-800 py-2"><div className="font-bold text-white">{stats.uniqueGoldfish}</div><div className="text-zinc-500">variantes</div></div>
            </div>
            <Link to="/admin" className="mt-4 block text-center text-xs text-amber-400 hover:underline">Ir a sincronizar →</Link>
          </div>
        </div>

        {/* Rareza + Idioma */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Shield size={16} className="text-violet-400" /> Por rareza (unidades)</h3>
            <div className="space-y-2">
              {stats.byRarity.map(([rarity, qty]) => (
                <div key={rarity} className="flex items-center gap-3">
                  <span className="w-20 text-xs capitalize text-zinc-400">{rarity}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700" style={{ width: `${(qty / maxRarity) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right text-xs font-medium text-white">{qty}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Globe size={16} className="text-sky-400" /> Por idioma</h3>
            <div className="flex gap-2">
              {stats.byLang.map(([lang, qty]) => {
                const pct = Math.round((qty / stats.totalUnits) * 100)
                return (
                  <div key={lang} className="flex-1 rounded-xl bg-zinc-800 p-3 text-center">
                    <div className="text-lg font-bold text-white">{qty}</div>
                    <div className="text-xs font-medium text-zinc-300">{lang}</div>
                    <div className="text-xs text-zinc-500">{pct}%</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full">
              {stats.byLang.map(([lang, qty], i) => {
                const colors: Record<string, string> = { ES: 'bg-amber-500', EN: 'bg-sky-500', PT: 'bg-emerald-500' }
                return <div key={lang} className={`${colors[lang] ?? 'bg-zinc-600'} ${i === 0 ? 'rounded-l-full' : ''} ${i === stats.byLang.length - 1 ? 'rounded-r-full' : ''}`} style={{ width: `${(qty / stats.totalUnits) * 100}%` }} />
              })}
            </div>
          </div>
        </div>

        {/* Ediciones Top + Tipos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Trophy size={16} className="text-amber-400" /> Top ediciones (filas)</h3>
            <div className="space-y-2">
              {stats.byEdition.map(([ed, cnt]) => (
                <div key={ed} className="flex items-center gap-3 text-sm">
                  <span className="w-28 truncate text-zinc-300">{ed}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${(cnt / maxEdition) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-zinc-400">{cnt}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white"><Boxes size={16} className="text-teal-400" /> Por tipo / color</h3>
            <div className="flex flex-wrap gap-2">
              {stats.byType.map(([type, qty]) => (
                <div key={type} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs">
                  <span className="text-zinc-400">{type}</span> <span className="font-bold text-white">{qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top caras + Recientes */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Coins size={16} className="text-amber-400" /> Top 5 más valiosas</h3>
            {stats.topExpensive.length === 0 ? (
              <p className="text-sm text-zinc-500">Sin precios sincronizados aún. Sincroniza para ver valor.</p>
            ) : (
              <div className="space-y-2">
                {stats.topExpensive.map(c => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl bg-zinc-800 px-3 py-2 hover:bg-zinc-700/50 transition">
                    <div className="truncate">
                      <div className="text-sm font-medium text-white truncate">{c.name_en ?? c.name_es}</div>
                      <div className="text-xs text-zinc-500">{c.edition} · {c.owner} · x{c.quantity}</div>
                    </div>
                    <div className="text-sm font-bold text-amber-400">{formatPrice((c.price_usd ?? 0) * c.quantity)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Clock size={16} className="text-zinc-400" /> Agregadas recientemente</h3>
            <div className="space-y-2">
              {stats.recent.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-zinc-800 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-white">{c.name_en ?? c.name_es}</div>
                    <div className="text-xs text-zinc-500">{c.edition} · {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className="text-xs text-zinc-400">x{c.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-2">
          <Link to="/admin" className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 transition">Ir al inventario</Link>
          <Link to="/" className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition inline-flex items-center gap-1"><ArrowLeft size={16} /> Ver catálogo</Link>
        </div>
      </main>
    </div>
  )
}
