import { editionToSetCode } from './mtg-sets'

// Orden cronológico por released_at de Scryfall (obtenido via GET /sets)
// Fuente: https://api.scryfall.com/sets - released_at
const SET_ORDER: Record<string, number> = {
  // Revised 1994-04-11
  '3ed': 1,
  // Fallen Empires 1994-11-15
  fem: 2,
  // Fourth Edition 1995-04-01
  '4ed': 3,
  // Ice Age 1995-06-03
  ice: 4,
  // Chronicles 1995-07
  chr: 5,
  // Homelands 1995-10-14
  hml: 6,
  // Alliances 1996-06-10
  all: 7,
  // Mirage 1996-10-08
  mir: 8,
  // Visions 1997-02-03
  vis: 9,
  // Fifth Edition 1997-03-24
  '5ed': 10,
  // Weatherlight 1997-06-09
  wth: 11,
  // Tempest 1997-10-14
  tmp: 12,
}

export function getEditionOrder(edition: string | null | undefined): number {
  if (!edition) return 999
  const code = editionToSetCode(edition)
  if (!code) return 999
  return SET_ORDER[code] ?? 999
}
