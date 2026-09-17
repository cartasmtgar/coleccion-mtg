import type { ScryfallCard } from '../types/scryfall'
import { editionToSetCode, normalizeCardName, parseGoldfishUrl, getCanonicalEnglishName } from '../lib/mtg-sets'

const SCRYFALL_BASE = 'https://api.scryfall.com'
const RATE_LIMIT_MS = 100

let lastRequest = 0
const cache = new Map<string, ScryfallCard>()

async function throttle(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastRequest
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed))
  }
  lastRequest = Date.now()
}

export async function fetchByScryfallId(id: string): Promise<ScryfallCard | null> {
  if (cache.has(id)) return cache.get(id)!

  await throttle()
  const res = await fetch(`${SCRYFALL_BASE}/cards/${id}`)
  if (res.status === 404) return null
  if (res.status === 429) {
    const retry = Number(res.headers.get('Retry-After') ?? '1') * 1000
    await new Promise((r) => setTimeout(r, retry))
    return fetchByScryfallId(id)
  }
  if (!res.ok) throw new Error(`Scryfall error ${res.status}`)
  const data = (await res.json()) as ScryfallCard
  cache.set(id, data)
  return data
}

// Legacy — se mantiene para compatibilidad pero ahora delega a exact
export async function searchScryfall(query: string): Promise<ScryfallCard | null> {
  return searchScryfallExact(query, null, null, null)
}

export async function searchScryfallExact(
  name: string,
  edition: string | null,
  _lang: string | null,
  _goldfishUrl: string | null,
): Promise<ScryfallCard | null> {
  // Regla de oro: la edición del Excel manda. Si se conoce el set, nunca
  // devolver una carta de otro set (DKM/WC02/CST/PTC). Mejor null (pendiente).
  const expectedSet = editionToSetCode(edition)
  // Usa helper canónico para cubrir filas con columnas invertidas y sufijos de artista
  const canonicalFromGold = getCanonicalEnglishName({ name_en: name, name_es: null, goldfish_url: _goldfishUrl })
  let goldSlug = parseGoldfishUrl(_goldfishUrl).cardSlug
  // Si gold slug tiene sufijo de artista (Homarid-Tedin) y empieza con el nombre, usar nombre
  if (goldSlug && goldSlug.includes('-') && normalizeCardName(name).toLowerCase() + '-' === goldSlug.toLowerCase().slice(0, normalizeCardName(name).length + 1).toLowerCase()) {
    goldSlug = normalizeCardName(name)
  }
  const candidates = [name, canonicalFromGold, goldSlug].filter(Boolean) as string[]
  // Deduplicar manteniendo orden
  const uniqueCandidates = [...new Set(candidates.map(c => normalizeCardName(c)))]

  for (const candidate of uniqueCandidates) {
    const result = await searchScryfallExactSingle(candidate, edition)
    if (result) {
      // Si el resultado no es del set esperado, descartar (no contaminar con otro set)
      if (expectedSet && result.set.toLowerCase() !== expectedSet.toLowerCase()) {
        continue
      }
      // Si hay variante goldfish (A/B o artista), resolver dentro del set esperado
      const variantCard = await resolveVariantIfNeeded(result, _goldfishUrl, expectedSet)
      return variantCard ?? result
    }
  }
  return null
}

async function resolveVariantIfNeeded(
  card: ScryfallCard,
  goldfishUrl: string | null,
  expectedSet: string | null,
): Promise<ScryfallCard | null> {
  const gold = parseGoldfishUrl(goldfishUrl)
  const variant = gold.variant
  if (!variant) return null
  // Prints filtradas por set en el SERVIDOR (oracleid + e:set).
  // prints_search_uri pagina de a 175 (nuevo a viejo): para cartas viejas con
  // muchísimas impresiones (básicas, staples) la primera página no trae ninguna
  // del set esperado y el filtro local quedaba vacío.
  const oracleId = (card as unknown as { oracle_id?: string }).oracle_id
  const printsUrl = oracleId && expectedSet
    ? `${SCRYFALL_BASE}/cards/search?q=${encodeURIComponent(`oracleid:${oracleId} e:${expectedSet}`)}&unique=prints`
    : (card as unknown as { prints_search_uri?: string }).prints_search_uri
  // Solo intentar si hay variant y hay URL de prints
  if (!printsUrl) return null
  try {
    await throttle()
    const res = await fetch(printsUrl, { headers: { Accept: 'application/json' } })
    if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After') ?? '1') * 1000
      await new Promise(r => setTimeout(r, retry))
      return resolveVariantIfNeeded(card, goldfishUrl, expectedSet)
    }
    if (!res.ok) return null
    const data = (await res.json()) as { data: ScryfallCard[] }
    // FIX patrón Reprisal-B -> wc02: filtrar SIEMPRE por el set esperado ANTES
    // de buscar la variante. prints_search viene ordenado de nuevo a viejo,
    // así que buscar global encontraba DKM/WC02/CST/PTC antes que all/hml.
    const setFiltered = expectedSet
      ? data.data.filter(c => c.set.toLowerCase() === expectedSet.toLowerCase())
      : data.data
    // Si el set esperado no tiene impresiones, no inventar: dejar pendiente.
    if (expectedSet && setFiltered.length === 0) return null
    const pool = setFiltered.length > 0 ? setFiltered : data.data
    // Buscar por collector_number con sufijo A/B/C/D o por artista (solo dentro del set)
    const variantLower = variant.toLowerCase()
    // Caso 1: variante de una letra -> solo vale match por collector_number.
    // Si no hay (ej tierras básicas con mismo número), devolver pendiente
    // en vez de adivinar por artista (la letra aparece en cualquier nombre).
    if (/^[a-d]$/i.test(variant)) {
      const found = pool.find(c => c.collector_number.toLowerCase().endsWith(variantLower))
      return found ?? null
    }
    // Caso 2: artista (ej Tedin, Hudson, Menges, Benson)
    const byArtist = pool.find(c => {
      const artist = (c as unknown as { artist?: string }).artist
      return artist && artist.toLowerCase().includes(variantLower)
    })
    if (byArtist) return byArtist
    // Fallback: si no encontró por variante, no reemplazar
    return null
  } catch {
    return null
  }
}

async function searchScryfallExactSingle(
  name: string,
  edition: string | null,
): Promise<ScryfallCard | null> {
  const normalized = normalizeCardName(name)
  const set = editionToSetCode(edition)
  const cacheKey = `exact:${normalized}:${set ?? 'no-set'}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  // Intento 1: exact + set (más preciso para edición)
  if (set) {
    await throttle()
    const url = `${SCRYFALL_BASE}/cards/named?exact=${encodeURIComponent(normalized)}&set=${encodeURIComponent(set)}`
    const res = await fetch(url)
    if (res.status === 404) {
      // Regla de oro: si la edición es conocida y no está en ese set,
      // NO caer a otros sets (evita DKM/WC02/CST/PTC). Dejar pendiente.
      return null
    } else if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After') ?? '1') * 1000
      await new Promise((r) => setTimeout(r, retry))
      return searchScryfallExactSingle(name, edition)
    } else if (res.ok) {
      const data = (await res.json()) as ScryfallCard
      cache.set(cacheKey, data)
      if (data.id) cache.set(data.id, data)
      return data
    } else {
      throw new Error(`Scryfall exact+set error ${res.status}`)
    }
  }

  // Intento 2: exact sin set
  await throttle()
  const url2 = `${SCRYFALL_BASE}/cards/named?exact=${encodeURIComponent(normalized)}`
  const res2 = await fetch(url2)
  if (res2.status === 404) {
    // intento 3: fuzzy como último recurso
    await throttle()
    const url3 = `${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(normalized)}`
    const res3 = await fetch(url3)
    if (res3.status === 404) return null
    if (res3.status === 429) {
      await new Promise((r) => setTimeout(r, 1200))
      return searchScryfallExactSingle(name, edition)
    }
    if (!res3.ok) throw new Error(`Scryfall fuzzy error ${res3.status}`)
    const data3 = (await res3.json()) as ScryfallCard
    cache.set(cacheKey, data3)
    if (data3.id) cache.set(data3.id, data3)
    return data3
  }
  if (res2.status === 429) {
    await new Promise((r) => setTimeout(r, 1200))
    return searchScryfallExactSingle(name, edition)
  }
  if (!res2.ok) throw new Error(`Scryfall exact error ${res2.status}`)
  const data2 = (await res2.json()) as ScryfallCard
  cache.set(cacheKey, data2)
  if (data2.id) cache.set(data2.id, data2)
  return data2
}

export function getScryfallImage(card: ScryfallCard): string | null {
  // A normal + truco CSS (scale) para evitar re-sync masivo de 1.6MB png
  if (card.image_uris?.normal) return card.image_uris.normal
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal
  if (card.image_uris?.png) return card.image_uris.png
  if (card.card_faces?.[0]?.image_uris?.png) return card.card_faces[0].image_uris.png
  return null
}

export function getScryfallPrice(card: ScryfallCard): number | null {
  if (card.prices.usd) return parseFloat(card.prices.usd)
  if (card.prices.usd_foil) return parseFloat(card.prices.usd_foil)
  return null
}

export interface BulkResult {
  data: ScryfallCard[]
  not_found: unknown[]
}

export async function bulkFetchCollection(
  identifiers: Array<{ name?: string; set?: string; id?: string }>,
): Promise<BulkResult> {
  await throttle()
  const res = await fetch(`${SCRYFALL_BASE}/cards/collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ identifiers }),
  })
  if (res.status === 429) {
    const retry = Number(res.headers.get('Retry-After') ?? '1') * 1000
    await new Promise((r) => setTimeout(r, retry))
    return bulkFetchCollection(identifiers)
  }
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Scryfall collection error ${res.status}: ${txt.slice(0, 300)}`)
  }
  const json = (await res.json()) as BulkResult
  for (const c of json.data) {
    cache.set(c.id, c)
    cache.set(`exact:${c.name}:${c.set}`, c)
  }
  return json
}
