import { useEffect, useState } from 'react'
import type { Card } from '../../types/card'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Label, Select, Textarea } from '../ui/Input'
import { CONDITIONS, LANGUAGES } from '../../lib/constants'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (payload: Omit<Card, 'id' | 'created_at'>) => Promise<void>
  initial?: Card | null
}

export function CardForm({ open, onClose, onSave, initial }: Props) {
  const [form, setForm] = useState<Omit<Card, 'id' | 'created_at'>>(() => ({
    name_es: initial?.name_es ?? '',
    name_en: initial?.name_en ?? '',
    quantity: initial?.quantity ?? 1,
    type: initial?.type ?? '',
    edition: initial?.edition ?? '',
    rarity: initial?.rarity ?? 'common',
    year: initial?.year ?? new Date().getFullYear().toString(),
    language: initial?.language ?? 'ES',
    condition: initial?.condition ?? 'NM',
    owner: initial?.owner ?? '',
    notes: initial?.notes ?? '',
    price_usd: initial?.price_usd ?? null,
    scryfall_id: initial?.scryfall_id ?? '',
    scryfall_uri: initial?.scryfall_uri ?? '',
    image_url: initial?.image_url ?? '',
  }))

  const key = initial?.id ?? 'new'

  useEffect(() => {
    if (open) {
      setForm({
        name_es: initial?.name_es ?? '',
        name_en: initial?.name_en ?? '',
        quantity: initial?.quantity ?? 1,
        type: initial?.type ?? '',
        edition: initial?.edition ?? '',
        rarity: initial?.rarity ?? 'common',
        year: initial?.year ?? new Date().getFullYear().toString(),
        language: initial?.language ?? 'ES',
        condition: initial?.condition ?? 'NM',
        owner: initial?.owner ?? '',
        notes: initial?.notes ?? '',
        price_usd: initial?.price_usd ?? null,
        scryfall_id: initial?.scryfall_id ?? '',
        scryfall_uri: initial?.scryfall_uri ?? '',
        image_url: initial?.image_url ?? '',
      })
    }
  }, [open, initial])

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar carta' : 'Agregar nueva carta'}>
      <form
        key={key}
        onSubmit={async (e) => {
          e.preventDefault()
          await onSave(form)
          onClose()
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Nombre ES *</Label>
            <Input value={form.name_es} onChange={(e) => setForm({ ...form, name_es: e.target.value })} required placeholder="Relámpago" />
          </div>
          <div>
            <Label>Nombre EN</Label>
            <Input value={form.name_en ?? ''} onChange={(e) => setForm({ ...form, name_en: e.target.value })} placeholder="Lightning Bolt" />
          </div>
          <div>
            <Label>Edición</Label>
            <Input value={form.edition ?? ''} onChange={(e) => setForm({ ...form, edition: e.target.value })} placeholder="Modern Masters" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Input value={form.type ?? ''} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Instant" />
          </div>
          <div>
            <Label>Rareza</Label>
            <Select value={form.rarity ?? ''} onChange={(e) => setForm({ ...form, rarity: e.target.value as Card['rarity'] })}>
              <option value="common">Común</option>
              <option value="uncommon">Infrecuente</option>
              <option value="rare">Rara</option>
              <option value="mythic">Mítica</option>
              <option value="special">Especial</option>
              <option value="bonus">Bonus</option>
            </Select>
          </div>
          <div>
            <Label>Año</Label>
            <Input value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2013" />
          </div>
          <div>
            <Label>Idioma</Label>
            <Select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Condición</Label>
            <Select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Cantidad</Label>
            <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Precio USD</Label>
            <Input type="number" step="0.01" value={form.price_usd ?? ''} onChange={(e) => setForm({ ...form, price_usd: e.target.value ? Number(e.target.value) : null })} placeholder="2.50" />
          </div>
          <div className="sm:col-span-2">
            <Label>Dueño</Label>
            <Input value={form.owner ?? ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Colección Principal" />
          </div>
          <div className="sm:col-span-2">
            <Label>Scryfall ID (para sync)</Label>
            <Input value={form.scryfall_id ?? ''} onChange={(e) => setForm({ ...form, scryfall_id: e.target.value })} placeholder="UUID de Scryfall" />
          </div>
          <div className="sm:col-span-2">
            <Label>Notas privadas</Label>
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{initial ? 'Guardar cambios' : 'Crear carta'}</Button>
        </div>
      </form>
    </Modal>
  )
}
