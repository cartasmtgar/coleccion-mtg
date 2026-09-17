/**
 * Mapeo de ediciones del Excel (ES) -> código Scryfall (set)
 * Fuente: Scryfall sets para las 12 ediciones presentes en seed_import
 */
const SET_MAP: Record<string, string> = {
  '4ta': '4ed',
  '4ta ': '4ed',
  'fourth edition': '4ed',
  '5ta': '5ed',
  'fifth edition': '5ed',
  'alliances': 'all',
  'allianses': 'all', // typo por si acaso
  'ice age': 'ice',
  'iceage': 'ice',
  'mirage': 'mir',
  'visions': 'vis',
  'chronicles': 'chr',
  'weatherlight': 'wth',
  'homelands': 'hml',
  'fallen empires': 'fem',
  'fallenempires': 'fem',
  'tempest': 'tmp',
  'revised': '3ed',
  'revised edition': '3ed',
  'all': 'all',
  'ice': 'ice',
  'mir': 'mir',
  '4ed': '4ed',
  '5ed': '5ed',
  '3ed': '3ed',
  'tmp': 'tmp',
  'chr': 'chr',
  'vis': 'vis',
  'hml': 'hml',
  'fem': 'fem',
  'wth': 'wth',
  // Introductory Two-Player Set (caja inicio 1996, marcada como 2PS en Excel)
  '2ps': 'itp',
  'itp': 'itp',
  'introductory two-player set': 'itp',
}

export function editionToSetCode(edition: string | null | undefined): string | null {
  if (!edition) return null
  const key = edition.trim().toLowerCase()
  return SET_MAP[key] ?? null
}

export function parseGoldfishUrl(url: string | null | undefined): {
  setName: string | null
  cardSlug: string | null
  variant: string | null
} {
  if (!url) return { setName: null, cardSlug: null, variant: null }
  try {
    const u = new URL(url)
    // /price/<SetName>/<CardName>
    const parts = u.pathname.split('/').filter(Boolean) // ['price','Fourth+Edition','Ivory+Tower']
    if (parts.length < 3 || parts[0] !== 'price') return { setName: null, cardSlug: null, variant: null }
    const setName = decodeURIComponent(parts[1].replace(/\+/g, ' '))
    let cardSlug = decodeURIComponent(parts[2].replace(/\+/g, ' '))
    let variant: string | null = null
    // variantes como "Aesthir Glider-B", "Order of Leitbur-C", "Homarid-Tedin",
    // "Urzas Mine-Pulley", "Urzas Power Plant-Bug", "Dwarven Soldier-Asplund-Faith"
    // OJO: no romper nombres con guión como "Man-o-War", "Will-o-the-Wisp"
    // ("War"/"Wisp" son parte del nombre) ni "Legions of Lim-Dul".
    const dashIdx = cardSlug.lastIndexOf('-')
    if (dashIdx > 0) {
      const suffix = cardSlug.slice(dashIdx + 1)
      const base = cardSlug.slice(0, dashIdx)
      // 1) Letra de variante A/B/C/D (comunes con varias artes y tierras básicas)
      if (/^[ABCDabcd]$/.test(suffix)) {
        variant = suffix.toUpperCase()
        cardSlug = base
      } else {
        // 2) Artista compuesto "Asplund-Faith" (dos tramos capitalizados)
        const prevDash = base.lastIndexOf('-')
        if (prevDash > 0) {
          const compound = cardSlug.slice(prevDash + 1)
          const compoundBase = cardSlug.slice(0, prevDash)
          if (/^[A-Z][A-Za-z]{2,19}-[A-Z][A-Za-z]{2,19}$/.test(compound) && !compoundBase.includes('-')) {
            variant = compound
            cardSlug = compoundBase
          }
        }
        // 3) Apellido de artista o palabra de arte, solo si la base no tiene
        // guiones (así "Will-o-the-Wisp" y "Man-o-War" quedan intactos).
        if (!variant && !base.includes('-')) {
          const isArtist = /^[A-Za-z]{4,20}$/.test(suffix) && !/^(paper|online)$/i.test(suffix)
          const isArtWord = /^[A-Z][A-Za-z]{2}$/.test(suffix) // ej "Bug"
          if (isArtist || isArtWord) {
            variant = suffix
            cardSlug = base
          }
        }
        // 4) Variante de arte en varias palabras ("Rock in Pot"): solo si la
        // base parece un nombre completo (evita "Tin-Wing Chimera" o
        // "Snow-Covered Island", donde el guión es parte del nombre).
        if (!variant && /^[A-Z][A-Za-z ]{2,29}$/.test(suffix) && suffix.includes(' ') && base.length > 6 && base.includes(' ')) {
          variant = suffix
          cardSlug = base
        }
      }
    }
    return { setName, cardSlug, variant }
  } catch {
    return { setName: null, cardSlug: null, variant: null }
  }
}

export function normalizeCardName(name: string): string {
  // quita espacios dobles, normaliza apóstrofes
  return name.trim().replace(/\s+/g, ' ')
}

export function normalizeForCompare(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’‘`'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getCanonicalEnglishName(card: { name_en?: string | null; name_es?: string | null; goldfish_url?: string | null }): string | null {
  const en = card.name_en?.trim() || null
  const es = card.name_es?.trim() || null
  const gold = parseGoldfishUrl(card.goldfish_url)
  let slug = gold.cardSlug?.trim() || null

  // Si el slug tiene sufijo de artista (ej Homarid-Tedin) y coincide con en/es, quitar sufijo
  if (slug && slug.includes('-')) {
    // Si slug es "Homarid-Tedin" y en es "Homarid", usar en
    if (en && slug.toLowerCase().startsWith(en.toLowerCase() + '-')) slug = en
    else if (es && slug.toLowerCase().startsWith(es.toLowerCase() + '-')) slug = es
    else {
      // Fallback: si slug contiene '-', y la parte antes del último '-' es un nombre conocido, usar esa parte
      // Para casos como "Aesthir Glider-B" -> "Aesthir Glider"
      const lastDash = slug.lastIndexOf('-')
      if (lastDash > 0) {
        const base = slug.slice(0, lastDash)
        // Si base coincide con en o es (sin artista), usar base
        if (en && base.toLowerCase() === en.toLowerCase()) slug = base
        else if (es && base.toLowerCase() === es.toLowerCase()) slug = base
        else if (/^[A-Za-z\s']+$/.test(base) && base.length > 3) {
          // Heurística: si base parece nombre y sufijo es corto (1-3) o artist (Tedin, Menges etc), usar base
          const suffix = slug.slice(lastDash + 1)
          if (suffix.length <= 6 && /^[A-Za-z]+$/.test(suffix)) slug = base
        }
      }
    }
  }

  // Detectar columnas invertidas: en es español, es es inglés (gold coincide con es)
  if (en && slug && en.toLowerCase() !== slug.toLowerCase() && es && es.toLowerCase() === slug.toLowerCase()) {
    return es
  }
  if (en) return en
  if (es) return es
  if (slug) return slug
  return null
}

/** Extrae el código de set desde un scryfall_uri (.../card/all/13b/...) */
export function getScryfallSetFromUri(uri: string | null | undefined): string | null {
  if (!uri) return null
  const m = uri.match(/\/card\/([^/]+)\//i)
  return m ? m[1].toLowerCase() : null
}

/** Extrae el collector_number desde un scryfall_uri (.../card/all/13b/...) */
export function getScryfallCollectorFromUri(uri: string | null | undefined): string | null {
  if (!uri) return null
  const m = uri.match(/\/card\/[^/]+\/([^/]+)\//i)
  return m ? m[1].toLowerCase() : null
}

/**
 * Variantes de arte por dibujo (tierras de Urza en Chronicles): mismo artista
 * y sin letra en el collector, así que no se pueden resolver automáticamente.
 * Van a picker manual.
 */
const ART_WORD_VARIANTS = new Set(
  ['Forest', 'Shore', 'Mountains', 'Plains', 'Tower', 'Sphere', 'Mouth', 'Pulley', 'Bug', 'Rock in Pot'].map(s => s.toLowerCase()),
)

/** ¿La variante es de arte por dibujo (tierras de Urza)? No resoluble automáticamente. */
export function isArtWordVariant(variant: string | null | undefined): boolean {
  if (!variant) return false
  return ART_WORD_VARIANTS.has(variant.toLowerCase())
}

export interface ReviewableCard {
  goldfish_url?: string | null
  image_url?: string | null
  scryfall_id?: string | null
  scryfall_uri?: string | null
  edition?: string | null
  rarity?: string | null
  reviewed?: boolean | null
}

/**
 * ¿Necesita revisión? Casos:
 * - Sin imagen (pendiente).
 * - Set distinto al del Excel, con o sin variante (ej Brown Ouphe en mrd).
 * - Variante de arte por dibujo (Urza): imposible automático → manual.
 * - Letra A/B/C/D cuyo collector no termina en esa letra (salvo tierras
 *   básicas, que comparten número en todas sus artes).
 * Las variantes ya bien sincronizadas no aparecen.
 */
export function needsReview(card: ReviewableCard): boolean {
  // Marcada como revisada a mano: no molestar más (salvo que el arte cambie,
  // en cuyo caso el sync resetea la marca)
  if (card.reviewed) return false
  if (!card.image_url && !card.scryfall_id) return true
  const expected = editionToSetCode(card.edition)
  const actual = getScryfallSetFromUri(card.scryfall_uri)
  if (expected && actual && expected.toLowerCase() !== actual) return true
  const variant = parseGoldfishUrl(card.goldfish_url).variant
  if (!variant) return false
  if (ART_WORD_VARIANTS.has(variant.toLowerCase())) return true
  // Letra A/B/C/D: el collector debe terminar en esa letra. Las básicas
  // comparten número entre artes, así que entran en Revisar hasta marcarlas.
  if (/^[ABCD]$/i.test(variant)) {
    const collector = getScryfallCollectorFromUri(card.scryfall_uri)
    if (collector && !collector.endsWith(variant.toLowerCase())) return true
  }
  return false
}
