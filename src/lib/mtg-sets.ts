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
  'all': 'all',
  'ice': 'ice',
  'mir': 'mir',
  '4ed': '4ed',
  '5ed': '5ed',
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
    // variantes como "Aesthir Glider-B", "Order of Leitbur-C", "Mangaras Tome"
    // Goldfish usa suffix "-B", "-C", "-Benson" etc para variantes
    const dashIdx = cardSlug.lastIndexOf('-')
    if (dashIdx > 0) {
      const suffix = cardSlug.slice(dashIdx + 1)
      // solo considerar variante si es corta (1-2 chars o Benson) y no es "paper"/"online" que va en hash
      if (/^[A-Z0-9]{1,3}$/i.test(suffix) || /^Benson$/i.test(suffix)) {
        variant = suffix
        cardSlug = cardSlug.slice(0, dashIdx)
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
