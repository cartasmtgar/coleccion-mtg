#!/usr/bin/env node
/**
 * scripts/sync-prices.mjs — Sincronización programada de precios (solo precios).
 *
 * Uso en CI (GitHub Actions, cada 12h):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/sync-prices.mjs
 * Prueba local sin escribir nada (usa tu .env):
 *   node scripts/sync-prices.mjs --dry-run
 *
 * - Lee las cartas con scryfall_id, pide precios en tandas de 75
 *   (endpoint bulk de Scryfall) y escribe SOLO las que cambiaron.
 * - Anota la fecha en public.sync_meta (key = 'last_prices_sync').
 * - La service_role key JAMÁS va en el repo: solo GitHub Secrets / entorno.
 */

const DRY_RUN = process.argv.includes('--dry-run')

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '')
// En local se acepta la anon key solo para --dry-run (lectura pública).
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan variables: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY para --dry-run).')
  process.exit(1)
}
if (!DRY_RUN && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Sin --dry-run se exige SUPABASE_SERVICE_ROLE_KEY (la anon key no puede escribir).')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const sbHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}
const scryHeaders = { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'ColeccionMTG-PriceSync/1.0' }

async function fetchJson(url, opts = {}, retries = 5) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, opts)
    if (res.status === 429 && attempt <= retries) {
      const wait = Number(res.headers.get('Retry-After') ?? '1') * 1000
      console.log(`  429, esperando ${wait}ms (intento ${attempt})...`)
      await sleep(wait)
      continue
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} en ${url}: ${body.slice(0, 200)}`)
    }
    return res.json()
  }
}

async function getCards() {
  const all = []
  let from = 0
  for (;;) {
    const url = `${SUPABASE_URL}/rest/v1/cards?select=id,scryfall_id,price_usd&order=created_at.desc&offset=${from}&limit=1000`
    const res = await fetch(url, { headers: sbHeaders })
    if (!res.ok) throw new Error(`Leyendo cartas: HTTP ${res.status}`)
    const chunk = await res.json()
    all.push(...chunk)
    if (chunk.length < 1000) break
    from += 1000
  }
  return all
}

function scryfallPrice(sc) {
  const raw = sc.prices?.usd ?? sc.prices?.usd_foil ?? null
  if (raw == null) return null
  const n = parseFloat(raw)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

async function getBulkPrices(ids) {
  const byId = new Map()
  const notFound = []
  for (let i = 0; i < ids.length; i += 75) {
    const batch = ids.slice(i, i + 75)
    const json = await fetchJson('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: scryHeaders,
      body: JSON.stringify({ identifiers: batch.map((id) => ({ id })) }),
    })
    for (const c of json.data ?? []) byId.set(c.id, scryfallPrice(c))
    notFound.push(...(json.not_found ?? []))
    if (i + 75 < ids.length) await sleep(150)
  }
  return { byId, notFound }
}

async function patchPrice(id, price) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cards?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ price_usd: price }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} actualizando ${id}`)
}

async function writeMeta(iso) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/sync_meta`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key: 'last_prices_sync', value: iso, updated_at: iso }),
  })
  if (res.status === 404 || res.status === 400) {
    console.log('  Aviso: tabla sync_meta no existe aún (corre la migración). Fecha no guardada.')
    return
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} guardando sync_meta`)
}

async function runWithPool(items, size, fn) {
  let errors = 0
  for (let i = 0; i < items.length; i += size) {
    const results = await Promise.allSettled(items.slice(i, i + size).map(fn))
    for (const r of results) if (r.status === 'rejected') errors++
  }
  return errors
}

function samePrice(a, b) {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return Math.round(a * 100) === Math.round(b * 100)
}

async function main() {
  console.log(`Sync de precios ${DRY_RUN ? '(DRY RUN, no se escribe nada)' : ''}`)
  const cards = await getCards()
  const withId = cards.filter((c) => c.scryfall_id)
  console.log(`Filas: ${cards.length} | con scryfall_id: ${withId.length} | sin scryfall_id (se omiten): ${cards.length - withId.length}`)
  const uniqueIds = [...new Set(withId.map((c) => c.scryfall_id))]
  console.log(`Versiones únicas a consultar: ${uniqueIds.length}`)

  const { byId, notFound } = await getBulkPrices(uniqueIds)
  console.log(`Precios recibidos: ${byId.size} | no encontrados en Scryfall: ${notFound.length}`)

  const toUpdate = []
  for (const c of withId) {
    if (!byId.has(c.scryfall_id)) continue
    const fresh = byId.get(c.scryfall_id)
    if (!samePrice(c.price_usd, fresh)) toUpdate.push({ id: c.id, price: fresh })
  }
  console.log(`Precios que cambiaron: ${toUpdate.length} (se omiten ${withId.length - toUpdate.length})`)

  let errors = 0
  if (!DRY_RUN && toUpdate.length > 0) {
    errors = await runWithPool(toUpdate, 8, (u) => patchPrice(u.id, u.price))
    console.log(`Escritas con error: ${errors}`)
  }

  const now = new Date().toISOString()
  if (!DRY_RUN) {
    await writeMeta(now)
    console.log(`Fecha guardada en sync_meta: ${now}`)
  }

  if (errors > 0) {
    console.error(`Terminado con ${errors} errores de escritura.`)
    process.exit(1)
  }
  console.log('Listo.')
}

main().catch((e) => {
  console.error('FALLO:', e instanceof Error ? e.message : e)
  process.exit(1)
})
