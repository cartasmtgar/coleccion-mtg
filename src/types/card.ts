export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus'
export type Condition = 'NM' | 'LP' | 'MP' | 'HP' | 'DMG'
export type Language = 'ES' | 'EN' | 'JP' | 'FR' | 'DE' | 'IT' | 'PT' | 'RU' | 'CN' | 'KR'

export interface Card {
  id: string
  name_es: string
  name_en: string | null
  quantity: number
  type: string | null
  edition: string | null
  rarity: Rarity | null
  year: string | null
  language: Language | string
  condition: Condition | string
  owner: string | null
  notes: string | null
  price_usd: number | null
  scryfall_id: string | null
  scryfall_uri: string | null
  image_url: string | null
  created_at: string
  updated_at?: string
}

export type CardInsert = Omit<Card, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
}

export type CardUpdate = Partial<Omit<Card, 'id' | 'created_at'>> & { id: string }

export const RARITY_LABELS: Record<string, string> = {
  common: 'Común',
  uncommon: 'Infrecuente',
  rare: 'Rara',
  mythic: 'Mítica',
  special: 'Especial',
  bonus: 'Bonus',
}

export const CONDITION_LABELS: Record<string, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  DMG: 'Damaged',
}
