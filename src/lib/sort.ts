import type { Card } from '../types/card'
import { getEditionOrder } from './sets'

export type SortDir = 'asc' | 'desc'
export interface SortRule<F extends string = string> {
  field: F
  dir: SortDir
}

const RARITY_ORDER: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  mythic: 4,
  special: 5,
  bonus: 6,
  basic: 7,
}

export function compareCard(a: Card, b: Card, field: string): number {
  let av: string | number = ''
  let bv: string | number = ''
  // a puede ser Card agrupada con _total
  const aAny = a as unknown as Record<string, unknown>
  const bAny = b as unknown as Record<string, unknown>
  switch (field) {
    case 'name':
      av = ((a.name_en ?? a.name_es) as string).toLowerCase()
      bv = ((b.name_en ?? b.name_es) as string).toLowerCase()
      break
    case 'edition':
      av = getEditionOrder(a.edition)
      bv = getEditionOrder(b.edition)
      break
    case 'rarity':
      av = RARITY_ORDER[(a.rarity ?? '') as string] ?? 99
      bv = RARITY_ORDER[(b.rarity ?? '') as string] ?? 99
      break
    case 'language':
      av = ((a.language ?? '') as string).toLowerCase()
      bv = ((b.language ?? '') as string).toLowerCase()
      break
    case 'condition':
      av = ((a.condition ?? '') as string).toLowerCase()
      bv = ((b.condition ?? '') as string).toLowerCase()
      break
    case 'owner':
      av = ((a.owner ?? '') as string).toLowerCase()
      bv = ((b.owner ?? '') as string).toLowerCase()
      break
    case 'quantity':
      av = (aAny._total as number) ?? a.quantity
      bv = (bAny._total as number) ?? b.quantity
      break
    case 'price':
      av = (a.price_usd ?? -1) as number
      bv = (b.price_usd ?? -1) as number
      break
    default:
      av = ''
      bv = ''
  }
  if (av < bv) return -1
  if (av > bv) return 1
  return 0
}

export function applySort<T extends Card>(cards: T[], rules: SortRule[]): T[] {
  if (rules.length === 0) return cards
  return [...cards].sort((a, b) => {
    for (const r of rules) {
      const cmp = compareCard(a, b, r.field)
      if (cmp !== 0) return cmp * (r.dir === 'asc' ? 1 : -1)
    }
    return 0
  })
}

export function upsertRule<F extends string>(rules: SortRule<F>[], field: F): SortRule<F>[] {
  const idx = rules.findIndex(r => r.field === field)
  if (idx !== -1) {
    const copy = [...rules]
    copy[idx] = { field, dir: copy[idx].dir === 'asc' ? 'desc' : 'asc' }
    return copy
  }
  if (rules.length >= 3) return rules
  return [...rules, { field, dir: 'asc' }]
}

export function toggleDir<F extends string>(rules: SortRule<F>[], field: F, dir: SortDir): SortRule<F>[] {
  return rules.map(r => (r.field === field ? { ...r, dir } : r))
}

export function removeRule<F extends string>(rules: SortRule<F>[], field: F): SortRule<F>[] {
  return rules.filter(r => r.field !== field)
}
