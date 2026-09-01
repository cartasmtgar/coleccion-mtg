import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Card } from '../types/card'

// Mock data for local dev without Supabase
const MOCK_CARDS: Card[] = [
  {
    id: '1',
    name_es: 'Relámpago',
    name_en: 'Lightning Bolt',
    quantity: 4,
    type: 'Instant',
    edition: 'Modern Masters',
    rarity: 'common',
    year: '2013',
    language: 'ES',
    condition: 'NM',
    owner: 'Colección Principal',
    notes: 'Playset completo',
    price_usd: 2.5,
    scryfall_id: 'a3fb8a3b-2f8c-4a1a-9b1a-1234567890aa',
    scryfall_uri: 'https://scryfall.com/card/mma/203/lightning-bolt',
    image_url: 'https://cards.scryfall.io/normal/front/a/3/a3fb8a3b-2f8c-4a1a-9b1a-1234567890aa.jpg',
    goldfish_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name_es: 'Tarmogoyf',
    name_en: 'Tarmogoyf',
    quantity: 2,
    type: 'Creature — Lhurgoyf',
    edition: 'Modern Masters',
    rarity: 'mythic',
    year: '2013',
    language: 'EN',
    condition: 'LP',
    owner: 'Juan Pérez',
    notes: null,
    price_usd: 15,
    scryfall_id: 'b2',
    scryfall_uri: 'https://scryfall.com/card/mma/122/tarmogoyf',
    image_url: 'https://cards.scryfall.io/normal/front/0/1/011e6a3e-0f8c-4a1e-9b1a-1234567890bb.jpg',
    goldfish_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name_es: 'Loto Negro',
    name_en: 'Black Lotus',
    quantity: 1,
    type: 'Artifact',
    edition: 'Alpha',
    rarity: 'rare',
    year: '1993',
    language: 'EN',
    condition: 'HP',
    owner: 'Bóveda',
    notes: 'Reservado, no a la venta',
    price_usd: 15000,
    scryfall_id: 'c3',
    scryfall_uri: 'https://scryfall.com/card/lea/232/black-lotus',
    image_url: 'https://cards.scryfall.io/normal/front/b/d/bd8faae2-337d-4a55-8d3d-1234567890cc.jpg',
    goldfish_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name_es: 'Fuerza de Voluntad',
    name_en: 'Force of Will',
    quantity: 4,
    type: 'Instant',
    edition: 'Alliances',
    rarity: 'uncommon',
    year: '1996',
    language: 'EN',
    condition: 'NM',
    owner: 'Colección Principal',
    notes: null,
    price_usd: 85,
    scryfall_id: 'd4',
    scryfall_uri: 'https://scryfall.com/card/all/55/force-of-will',
    image_url: null,
    goldfish_url: null,
    created_at: new Date().toISOString(),
  },
]

let localStore: Card[] = [...MOCK_CARDS]

export async function getCards(): Promise<Card[]> {
  if (!isSupabaseConfigured || !supabase) return [...localStore]

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Card[]
}

export async function createCard(payload: Omit<Card, 'id' | 'created_at'>): Promise<Card> {
  if (!isSupabaseConfigured || !supabase) {
    const newCard: Card = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    localStore.unshift(newCard)
    return newCard
  }
  const { data, error } = await supabase.from('cards').insert(payload).select().single()
  if (error) throw error
  return data as Card
}

export async function updateCard(id: string, patch: Partial<Card>): Promise<Card> {
  if (!isSupabaseConfigured || !supabase) {
    const idx = localStore.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Card not found')
    localStore[idx] = { ...localStore[idx], ...patch }
    return localStore[idx]
  }
  const { data, error } = await supabase.from('cards').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Card
}

export async function deleteCard(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    localStore = localStore.filter((c) => c.id !== id)
    return
  }
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}

export async function syncCardWithScryfall(
  card: Card,
  scryfall: { id: string; uri: string; image: string | null; price: number | null },
): Promise<Card> {
  return updateCard(card.id, {
    scryfall_id: scryfall.id,
    scryfall_uri: scryfall.uri,
    image_url: scryfall.image ?? card.image_url,
    price_usd: scryfall.price ?? card.price_usd,
  })
}
