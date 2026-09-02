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
