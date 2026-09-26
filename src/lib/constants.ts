export const EDITIONS = [
  'Alpha',
  'Beta',
  'Unlimited',
  'Revised',
  'Modern Masters',
  'Modern Horizons',
  'Commander Legends',
  'Throne of Eldraine',
  'Streets of New Capenna',
] as const

export const RARITIES = ['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus'] as const

export const LANGUAGES = ['ES', 'EN', 'JP', 'FR', 'DE', 'IT', 'PT', 'RU', 'CN', 'KR'] as const

export const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const

/** Ediciones presentes en la colección (etiquetas del Excel, tal cual van en la base). */
export const CARD_EDITIONS = [
  '4ta',
  '5ta',
  'Alliances',
  'Ice age',
  'Mirage',
  'Visions',
  'Chronicles',
  'Weatherlight',
  'Homelands',
  'Fallen Empires',
  'Tempest',
  'Revised',
  '2PS',
] as const

export const CONTACT_INFO = {
  whatsapp: '+34 600 000 000',
  whatsappLink: 'https://wa.me/34600000000',
  email: 'coleccion@mtg.example.com',
}
