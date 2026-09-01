import type { ScryfallCard } from '../types/scryfall'

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

export async function searchScryfall(query: string): Promise<ScryfallCard | null> {
  const key = `search:${query}`
  if (cache.has(key)) return cache.get(key)!

  await throttle()
  const res = await fetch(`${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(query)}`)
  if (res.status === 404) return null
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1200))
    return searchScryfall(query)
  }
  if (!res.ok) throw new Error(`Scryfall search error ${res.status}`)
  const data = (await res.json()) as ScryfallCard
  cache.set(key, data)
  if (data.id) cache.set(data.id, data)
  return data
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
