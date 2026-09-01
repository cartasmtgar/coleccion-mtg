import { Search, LayoutGrid, Table2 } from 'lucide-react'
import { Input, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import type { CardFilters, CatalogView } from '../../types/filters'

interface Props {
  filters: CardFilters
  onChange: (patch: Partial<CardFilters>) => void
  view: CatalogView
  onViewChange: (v: CatalogView) => void
  editions: string[]
  owners: string[]
  hideOwner?: boolean
}

export function SearchFilters({ filters, onChange, view, onViewChange, editions, owners, hideOwner }: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nombre (ES/EN), tipo..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pl-9"
            aria-label="Buscar cartas"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onViewChange('grid')}
            aria-label="Vista grid"
          >
            <LayoutGrid size={16} /> Grid
          </Button>
          <Button
            variant={view === 'table' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onViewChange('table')}
            aria-label="Vista tabla"
          >
            <Table2 size={16} /> Tabla
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Select value={filters.edition} onChange={(e) => onChange({ edition: e.target.value })}>
          <option value="">Edición (todas)</option>
          {editions.map((ed) => (
            <option key={ed} value={ed}>
              {ed}
            </option>
          ))}
        </Select>

        <Select value={filters.rarity} onChange={(e) => onChange({ rarity: e.target.value })}>
          <option value="">Rareza</option>
          <option value="common">Común</option>
          <option value="uncommon">Infrecuente</option>
          <option value="rare">Rara</option>
          <option value="mythic">Mítica</option>
          <option value="special">Especial</option>
        </Select>

        <Select value={filters.language} onChange={(e) => onChange({ language: e.target.value })}>
          <option value="">Idioma</option>
          <option value="ES">ES</option>
          <option value="EN">EN</option>
          <option value="JP">JP</option>
          <option value="FR">FR</option>
        </Select>

        <Select value={filters.condition} onChange={(e) => onChange({ condition: e.target.value })}>
          <option value="">Condición</option>
          <option value="NM">NM</option>
          <option value="LP">LP</option>
          <option value="MP">MP</option>
          <option value="HP">HP</option>
          <option value="DMG">DMG</option>
        </Select>

        {!hideOwner && (
          <Select value={filters.owner} onChange={(e) => onChange({ owner: e.target.value })}>
            <option value="">Dueño</option>
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        )}

        <Select value={filters.type} onChange={(e) => onChange({ type: e.target.value })}>
          <option value="">Tipo</option>
          <option value="Creature">Criatura</option>
          <option value="Instant">Instant</option>
          <option value="Sorcery">Sorcery</option>
          <option value="Artifact">Artifact</option>
          <option value="Enchantment">Enchantment</option>
          <option value="Planeswalker">Planeswalker</option>
        </Select>
      </div>

      {(filters.search || filters.edition || filters.rarity || filters.language || filters.condition || filters.owner || filters.type) && (
        <div className="flex justify-end">
          <button
            onClick={() =>
              onChange({
                search: '',
                edition: '',
                rarity: '',
                language: '',
                condition: '',
                owner: '',
                color: '',
                type: '',
              })
            }
            className="text-xs text-zinc-400 hover:text-amber-400 underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
