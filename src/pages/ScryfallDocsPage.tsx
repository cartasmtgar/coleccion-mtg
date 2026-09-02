import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Shuffle, ExternalLink, Sparkles } from 'lucide-react'

interface ScryfallCard {
  name: string
  printed_name?: string
  mana_cost?: string
  cmc?: number
  type_line?: string
  oracle_text?: string
  flavor_text?: string
  set: string
  set_name: string
  collector_number: string
  rarity: string
  artist?: string
  released_at: string
  lang: string
  image_uris?: Record<string, string>
  card_faces?: Array<{ image_uris?: Record<string, string>; oracle_text?: string }>
  prices: Record<string, string | null>
  legalities: Record<string, string>
  purchase_uris?: Record<string, string>
  scryfall_uri: string
}

interface Symbology {
  symbol: string
  svg_uri: string
  english: string
}

export function ScryfallDocsPage() {
  const [card, setCard] = useState<ScryfallCard | null>(null)
  const [status, setStatus] = useState('Cargando carta ejemplo…')
  const [searchName, setSearchName] = useState('')
  const [searchSet, setSearchSet] = useState('')
  const [symbols, setSymbols] = useState<Symbology[]>([])
  const [inlineSvgs, setInlineSvgs] = useState<Record<string, string>>({})

  const fetchCard = async (name: string, set?: string | null) => {
    const q = set ? `?exact=${encodeURIComponent(name)}&set=${encodeURIComponent(set)}` : `?exact=${encodeURIComponent(name)}`
    setStatus(`Cargando ${name}${set ? ' · ' + set : ''}…`)
    const r = await fetch(`https://api.scryfall.com/cards/named${q}`, { headers: { Accept: 'application/json' } })
    if (!r.ok) throw new Error(`Scryfall ${r.status}`)
    const data = (await r.json()) as ScryfallCard
    setCard(data)
    setStatus(`Carta cargada · ${data.name} · ${data.set_name}`)
  }

  const loadExample = () => fetchCard('Shield Sphere', 'all').catch(e => setStatus('Error: ' + (e as Error).message))
  const handleSearch = () => {
    const n = searchName.trim()
    if (!n) return setStatus('Ingresa un nombre')
    fetchCard(n, searchSet.trim() || null).catch(e => setStatus('Error: ' + (e as Error).message))
  }
  const handleRandom = async () => {
    setStatus('Cargando aleatoria…')
    const r = await fetch('https://api.scryfall.com/cards/random', { headers: { Accept: 'application/json' } })
    const c = (await r.json()) as ScryfallCard
    setSearchName(c.name)
    setSearchSet(c.set)
    setCard(c)
    setStatus(`Aleatoria · ${c.name} · ${c.set_name}`)
  }

  useEffect(() => {
    loadExample()
    fetch('https://api.scryfall.com/symbology', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then((d: { data: Symbology[] }) => {
        const priority = ['{W}', '{U}', '{B}', '{R}', '{G}', '{C}', '{S}', '{T}', '{Q}', '{E}', '{X}', '{2}', '{3}']
        const sorted = [...d.data].sort((a, b) => {
          const ia = priority.indexOf(a.symbol)
          const ib = priority.indexOf(b.symbol)
          if (ia !== -1 && ib !== -1) return ia - ib
          if (ia !== -1) return -1
          if (ib !== -1) return 1
          return 0
        })
        setSymbols(sorted)
        sorted.slice(0, 16).forEach(async s => {
          try {
            const svg = await (await fetch(s.svg_uri)).text()
            setInlineSvgs(prev => ({ ...prev, [s.symbol]: svg }))
          } catch {}
        })
      })
      .catch(() => setStatus('Error cargando symbology'))
  }, [])

  const sets = [
    { code: '4ed', name: 'Fourth Edition', excel: '4ta' },
    { code: '5ed', name: 'Fifth Edition', excel: '5ta' },
    { code: 'all', name: 'Alliances', excel: 'Alliances' },
    { code: 'ice', name: 'Ice Age', excel: 'Ice age' },
    { code: 'mir', name: 'Mirage', excel: 'Mirage' },
    { code: 'vis', name: 'Visions', excel: 'Visions' },
    { code: 'chr', name: 'Chronicles', excel: 'Chronicles' },
    { code: 'wth', name: 'Weatherlight', excel: 'Weatherlight' },
    { code: 'hml', name: 'Homelands', excel: 'Homelands' },
    { code: 'fem', name: 'Fallen Empires', excel: 'Fallen Empires' },
    { code: 'tmp', name: 'Tempest', excel: 'Tempest' },
    { code: '3ed', name: 'Revised', excel: 'Revised' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 grid place-items-center text-zinc-900 font-black">S</div>
            <div>
              <h1 className="font-extrabold leading-none">Scryfall API — Registro Visual</h1>
              <p className="text-xs text-zinc-500">Privado · Solo admin · Dinámico api.scryfall.com</p>
            </div>
          </div>
          <Link to="/admin" className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"><ArrowLeft size={14} /> Volver al admin</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">{status}</div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col md:flex-row gap-2">
          <input value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Nombre exacto en inglés (ej: Ghazbán Ogre, Man-o-War, Lightning Bolt)" className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none" />
          <input value={searchSet} onChange={e => setSearchSet(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Set (opcional, ej: vis, 4ed, chr)" className="w-full md:w-40 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none" />
          <button onClick={handleSearch} className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-zinc-900 hover:bg-amber-400 inline-flex items-center gap-1"><Search size={16} /> Buscar</button>
          <button onClick={handleRandom} className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm hover:bg-zinc-700 inline-flex items-center gap-1"><Shuffle size={16} /> Aleatoria</button>
        </div>

        {card && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Carta viva — <span className="text-amber-400">{card.name} · {card.set_name} ({card.set}/{card.collector_number})</span></h2>
              <a href={card.scryfall_uri} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-amber-500 text-zinc-900 px-3 py-1.5 text-xs font-semibold hover:bg-amber-400 inline-flex items-center gap-1">Abrir en Scryfall <ExternalLink size={14} /></a>
            </div>
            <div className="grid md:grid-cols-[320px_1fr] gap-4 p-4">
              <div>
                <img src={card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || ''} alt={card.name} className="w-full rounded-xl border border-zinc-800" />
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  {(['small', 'normal', 'large', 'png', 'art_crop', 'border_crop'] as const).map(k => (
                    <a key={k} href={card.image_uris?.[k] ?? '#'} target="_blank" className={`rounded bg-zinc-800 px-2 py-1 text-center hover:bg-zinc-700 ${!card.image_uris?.[k] ? 'opacity-40 pointer-events-none' : ''}`}>{k}</a>
                  ))}
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">name / printed_name</div><div className="font-semibold">{card.name}{card.printed_name && card.printed_name !== card.name ? ` / ${card.printed_name}` : ''}</div></div>
                  <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">mana_cost · cmc</div><div className="font-mono">{card.mana_cost || '—'}</div><div className="text-xs">cmc: {card.cmc ?? '—'}</div></div>
                  <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">type_line</div><div>{card.type_line || '—'}</div></div>
                  <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">set · collector_number</div><div>{card.set_name} ({card.set})</div><div className="text-xs text-zinc-400">#{card.collector_number} · {card.rarity}</div></div>
                  <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">rarity · artist</div><div>{card.rarity}</div><div className="text-xs text-zinc-400">{(card as unknown as { artist?: string }).artist || ''}</div></div>
                  <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">released_at · lang</div><div>{card.released_at}</div><div className="text-xs">{card.lang}</div></div>
                </div>
                <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3"><div className="text-xs text-zinc-500">oracle_text</div><pre className="whitespace-pre-wrap text-sm font-mono">{card.oracle_text || card.card_faces?.[0]?.oracle_text || '—'}</pre></div>
                <div className="rounded-xl bg-zinc-800 p-3 flex flex-wrap gap-2 text-xs">{Object.entries(card.prices || {}).map(([k, v]) => <span key={k} className="rounded bg-zinc-700 px-2 py-1">{k}: <b className="text-amber-400">{(v as string) ?? '—'}</b></span>)}</div>
                <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">legalities</div><div className="flex flex-wrap gap-1 mt-1">{Object.entries(card.legalities || {}).map(([f, s]) => <span key={f} className={`rounded-full border px-2 py-0.5 text-xs ${s === 'legal' ? 'bg-emerald-900/30 border-emerald-700 text-emerald-300' : 'bg-zinc-800 border-zinc-700'}`}>{f}: {s as string}</span>)}</div></div>
                <div className="rounded-xl bg-zinc-800 p-3"><div className="text-xs text-zinc-500">purchase_uris</div><div className="flex flex-wrap gap-2 mt-1 text-xs">{Object.entries(card.purchase_uris || {}).map(([k, v]) => <a key={k} href={v as string} target="_blank" className="rounded bg-amber-500 text-zinc-900 px-2 py-1 font-semibold hover:bg-amber-400">{k} ↗</a>)}</div></div>
                <details className="rounded-xl bg-zinc-950 border border-zinc-800 p-3"><summary className="cursor-pointer text-xs font-semibold">JSON completo</summary><pre className="mono text-xs overflow-auto max-h-96 mt-2">{JSON.stringify(card, null, 2)}</pre></details>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-bold flex items-center gap-2"><Sparkles size={16} className="text-amber-400" /> Iconos de maná — GET /symbology</h2>
          <p className="text-xs text-zinc-500 mt-1">Incluye W (blanco), U (azul), B (negro), R (rojo), G (verde) + incoloro/tap.</p>
          <h3 className="text-xs font-semibold mt-3">Opción A — &lt;img&gt; dependiente</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {symbols.slice(0, 32).map(s => (
              <div key={s.symbol} className="flex flex-col items-center gap-1 rounded-xl bg-zinc-800 p-2 min-w-[72px]">
                <img src={s.svg_uri} alt={s.symbol} className="h-8 w-8" loading="lazy" />
                <span className="mono text-xs">{s.symbol}</span>
                <span className="text-xs text-zinc-500">{s.english}</span>
              </div>
            ))}
          </div>
          <h3 className="text-xs font-semibold mt-4">Opción B — SVG inline (sin dependencia, recoloreable)</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {symbols.slice(0, 16).map(s => (
              <div key={s.symbol + '-inline'} className="flex flex-col items-center gap-1 rounded-xl bg-zinc-800 p-2 min-w-[72px] text-amber-400">
                <div className="h-8 w-8 [&_svg]:h-8 [&_svg]:w-8" dangerouslySetInnerHTML={{ __html: inlineSvgs[s.symbol] || '' }} />
                <span className="mono text-xs text-zinc-300">{s.symbol}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-bold">Iconos de ediciones — https://svgs.scryfall.io/sets/{'{code}'}.svg</h2>
          <h3 className="text-xs font-semibold mt-3">Opción A — dependiente</h3>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
            {sets.map(s => (
              <a key={s.code} href={`https://scryfall.com/sets/${s.code}`} target="_blank" className="flex items-center gap-3 rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700">
                <img src={`https://svgs.scryfall.io/sets/${s.code}.svg`} className="h-8 w-8" alt={s.code} />
                <div><div className="text-sm font-semibold">{s.name}</div><div className="text-xs text-zinc-500">{s.code} · Excel: {s.excel}</div></div>
              </a>
            ))}
          </div>
          <h3 className="text-xs font-semibold mt-4">Opción B — inline (fetch y embed, sin dependencia)</h3>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3" id="setsB">
            {sets.map(s => (
              <div key={s.code + '-inline'} className="flex items-center gap-3 rounded-xl bg-zinc-800 p-3">
                <img src={`https://svgs.scryfall.io/sets/${s.code}.svg`} className="h-8 w-8" alt={s.code} />
                <div><div className="text-sm font-semibold">{s.name}</div><div className="text-xs text-zinc-500">{s.code}</div></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-bold">Mapeo Scryfall → tu DB</h2>
          <div className="overflow-auto">
            <table className="w-full text-left text-xs mt-2">
              <thead className="text-zinc-500 border-b border-zinc-800"><tr><th className="py-2">Campo</th><th>Ejemplo</th><th>¿Ya usado?</th><th>¿Guardar?</th><th>Idea UI</th></tr></thead>
              <tbody className="divide-y divide-zinc-800">
                {[
                  ['id', '1730d219…', 'Sí', 'Sí', 'Link directo'],
                  ['mana_cost / cmc', '{2} / 2', 'No', 'Recomendado', 'Filtros CMC/color'],
                  ['type_line', 'Artifact Creature', 'Sí', 'Sí', 'Tipo'],
                  ['colors / color_identity', '[] / [U]', 'Parcial', 'Sí', 'Filtros color'],
                  ['power/toughness', '0/6', 'No', 'Opcional', 'Criaturas'],
                  ['prices', 'usd 2.50', 'Parcial', 'Sí', 'Valor'],
                  ['legalities', 'modern:legal', 'Sí', 'No', 'Legalidades'],
                ].map(([a, b, c, d, e]) => (
                  <tr key={a}><td className="py-2 mono">{a}</td><td className="py-2">{b}</td><td className="py-2">{c}</td><td className="py-2">{d}</td><td className="py-2 text-zinc-400">{e}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
