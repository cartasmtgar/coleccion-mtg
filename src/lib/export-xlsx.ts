import * as XLSX from 'xlsx'
import type { Card } from '../types/card'

export interface CatalogExportRow {
  rep: Card
  total: number
  langs: Record<string, number>
}

/** Misma agrupación que el catálogo: por goldfish_url (o nombre+edición). */
export function groupCatalogCards(cards: Card[]): CatalogExportRow[] {
  const map = new Map<string, CatalogExportRow>()
  for (const c of cards) {
    const key = c.goldfish_url ? c.goldfish_url : `${c.name_es}||${c.name_en}||${c.edition}||${c.type}`
    const entry = map.get(key)
    if (entry) {
      entry.total += c.quantity
      entry.langs[c.language] = (entry.langs[c.language] ?? 0) + c.quantity
    } else {
      map.set(key, { rep: c, total: c.quantity, langs: { [c.language]: c.quantity } })
    }
  }
  return [...map.values()]
}

const capitalize = (s: string | null | undefined) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

/** Descarga todo el catálogo agrupado como .xlsx real (compatible Excel). */
export function downloadCatalogXlsx(cards: Card[]): void {
  const HEADER = [
    'Nombre ES',
    'Nombre EN',
    'Edición',
    'Rareza',
    'Tipo',
    'Idiomas',
    'Cantidad',
    'Precio unit. USD',
    'Precio total USD',
  ];
  const rows = groupCatalogCards(cards)
    .sort((a, b) =>
      (a.rep.name_en ?? a.rep.name_es).toLowerCase() <
      (b.rep.name_en ?? b.rep.name_es).toLowerCase()
        ? -1
        : 1,
    )
    .map(({ rep, total, langs }) => {
      const unit = rep.price_usd ?? null
      return {
        'Nombre ES': rep.name_es,
        'Nombre EN': rep.name_en ?? '',
        'Edición': rep.edition ?? '',
        'Rareza': capitalize(rep.rarity),
        'Tipo': rep.rarity === 'basic' ? 'Tierra básica' : (rep.type ?? ''),
        'Idiomas': Object.entries(langs)
          .map(([l, q]) => `${l} x${q}`)
          .join(' · '),
        'Cantidad': total,
        'Precio unit. USD': unit ?? '',
        'Precio total USD':
          unit == null ? '' : Math.round(unit * total * 100) / 100,
      }
    })

  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADER })
  ws['!cols'] = [
    { wch: 28 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 10 },
    { wch: 16 },
    { wch: 16 },
  ];

  // Filtros automáticos en el encabezado (la edición gratuita de la
  // librería no escribe colores de celda, pero autofiltros y anchos sí).
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: 0, c: HEADER.length - 1 },
    }),
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo')
  const stamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `coleccion-mtg-${stamp}.xlsx`)
}
