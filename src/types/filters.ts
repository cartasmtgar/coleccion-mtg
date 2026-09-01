export type CatalogView = 'grid' | 'table'
export type AppView = 'catalog' | 'admin'

export interface CardFilters {
  search: string
  edition: string
  rarity: string
  language: string
  condition: string
  owner: string
  color: string
  type: string
}

export const DEFAULT_FILTERS: CardFilters = {
  search: '',
  edition: '',
  rarity: '',
  language: '',
  condition: '',
  owner: '',
  color: '',
  type: '',
}
