export interface ScryfallCard {
  id: string
  name: string
  printed_name?: string
  lang: string
  uri: string
  scryfall_uri: string
  image_uris?: {
    small: string
    normal: string
    large: string
    png: string
    art_crop: string
    border_crop: string
  }
  card_faces?: Array<{
    name: string
    image_uris?: ScryfallCard['image_uris']
    printed_text?: string
    oracle_text?: string
  }>
  prices: {
    usd: string | null
    usd_foil: string | null
    eur: string | null
    tix: string | null
  }
  legalities: Record<string, 'legal' | 'not_legal' | 'restricted' | 'banned'>
  type_line: string
  oracle_text?: string
  printed_text?: string
  set_name: string
  set: string
  collector_number: string
  rarity: string
  released_at: string
  color_identity: string[]
}

export interface ScryfallError {
  object: 'error'
  code: string
  status: number
  details: string
}
