import { Search, LayoutGrid, Table2 } from 'lucide-react'
import { Input, Label, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import { editionToSetCode } from '../../lib/mtg-sets'
import type { CardFilters, CatalogView } from '../../types/filters'

interface Props {
  filters: CardFilters
  onChange: (patch: Partial<CardFilters>) => void
  view: CatalogView
  onViewChange: (v: CatalogView) => void
  editions: string[]
  owners: string[]
  hideOwner?: boolean
  showReviewedFilter?: boolean
}

export function SearchFilters({ filters, onChange, view, onViewChange, editions, owners, hideOwner, showReviewedFilter }: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by name (ES/EN), type..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pl-9"
            aria-label="Search cards"
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <div>
          <Label>Edition</Label>
          <Select value={filters.edition} onChange={(e) => onChange({ edition: e.target.value })}>
            <option value="">All</option>
            {editions.map((ed) => (
              <option key={ed} value={ed}>
                {(editionToSetCode(ed) ?? ed).toUpperCase()}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Rarity</Label>
          <Select value={filters.rarity} onChange={(e) => onChange({ rarity: e.target.value })}>
            <option value="">All</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="mythic">Mythic</option>
            <option value="special">Special</option>
            <option value="bonus">Bonus</option>
            <option value="basic">Basic</option>
          </Select>
        </div>

        <div>
          <Label>Language</Label>
          <Select value={filters.language} onChange={(e) => onChange({ language: e.target.value })}>
            <option value="">All</option>
            <option value="ES">ES</option>
            <option value="EN">EN</option>
            <option value="PT">PT</option>
          </Select>
        </div>

        <div>
          <Label>Color</Label>
          <Select value={filters.color} onChange={(e) => onChange({ color: e.target.value })}>
            <option value="">All</option>
            <option value="Blanco">White (W)</option>
            <option value="Azul">Blue (U)</option>
            <option value="Negro">Black (B)</option>
            <option value="Rojo">Red (R)</option>
            <option value="Verde">Green (G)</option>
            <option value="Doradas">Gold</option>
            <option value="Artefacto">Artifact</option>
            <option value="Tierra">Land</option>
          </Select>
        </div>

        <div>
          <Label>Condition</Label>
          <Select value={filters.condition} onChange={(e) => onChange({ condition: e.target.value })}>
            <option value="">All</option>
            <option value="NM">NM</option>
            <option value="LP">LP</option>
            <option value="MP">MP</option>
            <option value="HP">HP</option>
            <option value="DMG">DMG</option>
          </Select>
        </div>

        {!hideOwner && (
          <div>
            <Label>Owner</Label>
            <Select value={filters.owner} onChange={(e) => onChange({ owner: e.target.value })}>
              <option value="">All</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
        )}

        {showReviewedFilter && (
          <div>
            <Label>Reviewed</Label>
            <Select value={filters.reviewed} onChange={(e) => onChange({ reviewed: e.target.value })}>
              <option value="">All</option>
              <option value="yes">Check</option>
              <option value="no">Not reviewed</option>
            </Select>
          </div>
        )}

        <div>
          <Label>Reserved List?</Label>
          <Select value={filters.reserved} onChange={(e) => onChange({ reserved: e.target.value })}>
            <option value="">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        </div>
      </div>

      {(filters.search || filters.edition || filters.rarity || filters.language || filters.color || filters.condition || filters.owner || filters.reviewed || filters.reserved) && (
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
                reviewed: '',
                reserved: '',
              })
            }
            className="text-xs text-zinc-400 hover:text-amber-400 underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
