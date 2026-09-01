import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = path.resolve('coleccion.xlsx');
const wb = XLSX.readFile(file);

const LANGUAGE_MAP = { 'Español': 'ES', 'Ingles': 'EN', 'Português': 'PT', 'Portugues': 'PT' };
const RARITY_MAP = { 'Rare': 'rare', 'Uncommon': 'uncommon', 'Common': 'common', 'Basic Land': 'basic', 'BasicLand': 'basic' };

function normalizeStr(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function esc(v) {
  if (v == null) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

const grouped = new Map();
let totalRows = 0;
let skipped = 0;

for (const sheetName of wb.SheetNames) {
  const owner = sheetName.replace(/^Cartas\s+/i, '').trim(); // Pollo, Phil, Yupi
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
  if (rows.length === 0) continue;
  const headers = rows[0];
  const idx = {};
  headers.forEach((h,i)=>{ if(h!=null) idx[String(h).trim()] = i; });

  // Resolve indices flexibly
  const iNombre = idx['Nombre'] ?? 0;
  const iName = idx['Name'] ?? 1;
  const iQ = idx['Q.'] ?? 2;
  const iTipo = idx['Tipo'] ?? 3;
  const iEdicion = idx['Edicion'] ?? 4;
  const iRareza = idx['Rareza'] ?? 5;
  const iAño = idx['Año'] ?? 6;
  const iIdioma = idx['Idioma'] ?? 8;
  const iEstado = idx['Estado'] ?? 9;
  const iLink = idx['Link'] ?? 12;
  const iNotas = idx['Notas'] ?? 13;

  for (let r=1; r<rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const name_es = normalizeStr(row[iNombre]);
    const name_en = normalizeStr(row[iName]);
    if (!name_es && !name_en) { skipped++; continue; }
    totalRows++;
    const qtyRaw = row[iQ];
    let qty = parseInt(qtyRaw,10);
    if (isNaN(qty) || qty<0) qty = 1;
    const type = normalizeStr(row[iTipo]);
    const edition = normalizeStr(row[iEdicion]);
    const rarityRaw = normalizeStr(row[iRareza]);
    const rarity = rarityRaw ? (RARITY_MAP[rarityRaw] ?? rarityRaw.toLowerCase()) : null;
    const yearRaw = row[iAño];
    const year = yearRaw == null ? null : String(yearRaw).trim();
    const idiomaRaw = normalizeStr(row[iIdioma]);
    const language = idiomaRaw ? (LANGUAGE_MAP[idiomaRaw] ?? idiomaRaw) : 'ES';
    // Estado all empty per user, keep null
    const condition = null;
    const goldfish_url = normalizeStr(row[iLink]);
    const notes = normalizeStr(row[iNotas]);

    const keyObj = { owner, name_es, name_en, type, edition, rarity, year, language, goldfish_url, notes };
    const key = JSON.stringify(keyObj);
    if (grouped.has(key)) {
      grouped.get(key).quantity += qty;
    } else {
      grouped.set(key, { owner, name_es, name_en, quantity: qty, type, edition, rarity, year, language, condition, notes, goldfish_url, price_usd: null, scryfall_id: null, scryfall_uri: null, image_url: null });
    }
  }
}

const cards = [...grouped.values()];
console.log(`Total filas leídas: ${totalRows}, agrupadas: ${cards.length}, filas vacías saltadas: ${skipped}`);
console.log(`Por owner:`);
for (const o of ['Pollo','Phil','Yupi']) console.log(o, cards.filter(c=>c.owner===o).length + ' cartas únicas, ' + cards.filter(c=>c.owner===o).reduce((a,c)=>a+c.quantity,0) + ' unidades');
console.log(`Rarity dist:`, [...new Set(cards.map(c=>c.rarity))]);
console.log(`Language dist:`, [...new Set(cards.map(c=>c.language))]);

// Generate SQL seed file
let sql = `-- seed import generado desde coleccion.xlsx - ${new Date().toISOString()}\n`;
sql += `-- Total filas agrupadas: ${cards.length} (original ${totalRows})\n`;
sql += `TRUNCATE public.cards RESTART IDENTITY CASCADE;\n`;
sql += `INSERT INTO public.cards (name_es, name_en, quantity, type, edition, rarity, year, language, condition, owner, notes, goldfish_url, price_usd, scryfall_id, scryfall_uri, image_url) VALUES\n`;
const values = cards.map(c => `(${esc(c.name_es)}, ${esc(c.name_en)}, ${c.quantity}, ${esc(c.type)}, ${esc(c.edition)}, ${esc(c.rarity)}, ${esc(c.year)}, ${esc(c.language)}, ${esc(c.condition)}, ${esc(c.owner)}, ${esc(c.notes)}, ${esc(c.goldfish_url)}, NULL, NULL, NULL, NULL)`).join(',\n');
sql += values + ';\n';

fs.writeFileSync('supabase/seed_import.sql', sql, 'utf8');
console.log('SQL escrito a supabase/seed_import.sql (' + (sql.length/1024).toFixed(1) + ' KB)');

// Also generate JSON for debugging
fs.writeFileSync('supabase/seed_import.json', JSON.stringify(cards,null,2), 'utf8');
console.log('JSON escrito a supabase/seed_import.json');
