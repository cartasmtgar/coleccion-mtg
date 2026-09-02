import type { ScryfallCard } from '../types/scryfall'
import { editionToSetCode, normalizeCardName } from '../lib/mtg-sets'

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
      // fallback a search sin set
    } else if (res.status === 429) {
      const retry = Number(res.headers.get('Retry-After') ?? '1') * 1000
      await new Promise((r) => setTimeout(r, retry))
      return searchScryfallExact(name, edition, _lang, _goldfishUrl)
    } else if (res.ok) {
      const data = (await res.json()) as ScryfallCard
      cache.set(cacheKey, data)
      if (data.id) cache.set(data.id, data)
      return data
    } else {
      throw new Error(`Scryfall exact+set error ${res.status}`)
    }
  }

  // Intento 2: exact sin set (lang no se usa para named, pero sirve para validar)
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
      return searchScryfallExact(name, edition, _lang, _goldfishUrl)
    }
    if (!res3.ok) throw new Error(`Scryfall fuzzy error ${res3.status}`)
    const data3 = (await res3.json()) as ScryfallCard
    cache.set(cacheKey, data3)
    if (data3.id) cache.set(data3.id, data3)
    return data3
  }
  if (res2.status === 429) {
    await new Promise((r) => setTimeout(r, 1200))
    return searchScryfallExact(name, edition, _lang, _goldfishUrl)
  }
  if (!res2.ok) throw new Error(`Scryfall exact error ${res2.status}`)
  const data2 = (await res2.json()) as ScryfallCard
  cache.set(cacheKey, data2)
  if (data2.id) cache.set(data2.id, data2)
  return data2
}

export function getScryfallImage(card: ScryfallCard): string | null {
  if (card.image_uris?.normal) return card.image_uris.normal
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal
  return null
}

export function getScryfallPrice(card: ScryfallCard): number | null {
  if (card.prices.usd) return parseFloat(card.prices.usd)
  if (card.prices.usd_foil) return parseFloat(card.prices.usd_foil)
  return null
}
