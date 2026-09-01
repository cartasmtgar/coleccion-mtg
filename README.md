# Colección MTG Web + Admin

Plataforma web para **gestionar y exhibir colecciones de Magic: The Gathering (MTG)**. Migra el inventario desde hoja de cálculo a Supabase, enriquece cada carta con datos de la **API de Scryfall** (imagen HD, precios, legalidades) y ofrece un catálogo público filtrable + panel de administración CRUD completo.

## Características

- **Catálogo público** sin carrito: buscador avanzado por nombre, edición, color, tipo, rareza e idioma; vistas Grid (preview HD) y Tabla detallada; modal de detalle con datos Scryfall sincronizados.
- **Panel Admin**: CRUD por carta, edición de dueño/condición/idioma/cantidad/notas, sincronización individual y masiva con Scryfall, respeta rate-limit y cache por `scryfall_id`.
- **Contacto global**: bloque/modal con WhatsApp, Email y formulario sencillo para cotizaciones.
- **Stack moderno**: Vite 6 + React 19 + TypeScript 6 (strict) + Tailwind CSS 4 + lucide-react + Supabase.

## Requisitos

- Node.js 18+ y npm 9+
- Cuenta Supabase (URL + anon key)
- (Opcional) Cuenta Netlify para deploy

## Instalación local

```bash
npm install
cp .env.example .env   # completar credenciales
npm run dev            # http://localhost:5173
```

## Variables de entorno

Crea un archivo `.env` en la raíz (ver `.env.example`):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> Nunca expongas `service_role` en el frontend. Solo `VITE_SUPABASE_ANON_KEY`.

## Supabase — Esquema

Ejecuta `supabase/schema.sql` en el SQL Editor de Supabase:

1. Supabase Dashboard → SQL Editor → New query
2. Pega el contenido de `supabase/schema.sql` y ejecuta
3. Verifica la tabla `cards` en Table Editor

El esquema incluye índices, RLS (lectura pública, escritura solo autenticados) y timestamps.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor desarrollo con HMR |
| `npm run build` | Typecheck + build producción (`dist/`) |
| `npm run preview` | Preview del build |
| `npm run lint` | Lint con Oxlint |

## Despliegue en Netlify

### Opción 1 — Desde Git
1. Conecta el repo en Netlify (New site from Git).
2. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Environment variables → añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy. El archivo `netlify.toml` ya está configurado.

### Opción 2 — CLI
```bash
npm install -g netlify-cli
netlify deploy --build --prod
```

El `netlify.toml` incluye:
- Build command y publish dir
- Redirect SPA (`/*` → `/index.html`)
- Headers de cache y seguridad

## Conexión con Scryfall

- Endpoint base: `https://api.scryfall.com`
- Rate limit: 50-100ms entre requests (implementado en `src/services/scryfall.ts`).
- Manejo de 404/429 con reintentos y backoff.
- Cache por `scryfall_id` para evitar llamadas redundantes.

## Estructura

```
src/
  components/ui       → Button, Modal, Badge, Input, Select
  components/public   → SearchFilters, CardGrid, CardTable, CardDetail, ContactModal
  components/admin    → AdminTable, CardForm, SyncButton
  lib/                → supabase.ts, utils.ts, constants.ts
  services/           → cards.service.ts, scryfall.ts
  types/              → card.ts, scryfall.ts, filters.ts
  hooks/              → useCards.ts
supabase/schema.sql
```

## Changelog

Ver [CHANGELOG.md](./CHANGELOG.md).

## Licencia

MIT
