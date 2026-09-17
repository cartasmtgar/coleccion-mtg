# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- `ROADMAP.md` como fuente única de tareas pendientes/ideas/pospuestas con regla de actualización continua.
- `dev.bat` para iniciar servidor local con doble click y apertura automática del navegador.
- Mapa `2PS` → `itp` (Introductory Two-Player Set) en `src/lib/mtg-sets.ts`.

### Fixed
- Sync Scryfall respeta la edición del Excel: la variante `-A/-B`/artista se resuelve solo dentro del set esperado (`src/services/scryfall.ts`). Elimina el fallback a otros sets que mandaba `Reprisal-B` a `wc02`, `Phyrexian War Beast-B` a `dkm`, `Torture-A` a `ptc` y `Casting of Bones-B`/`Lat-Nam's Legacy` a `cst`. Si no se encuentra el arte exacto, la carta queda pendiente en vez de guardar una versión incorrecta.
- `src/pages/AdminPage.tsx` (bulk) verifica el `set` antes de guardar; `src/components/admin/VariantPicker.tsx` filtra estrictamente por set y ordena por `collector_number`.
- `parseGoldfishUrl` acepta apellidos de artista (`Tedin`, `Hudson`, etc.) sin romper nombres con guión como `Man-o-War` o `Will-o'-the-Wisp`.
- Detección de variantes completa: letra `D` (tierras básicas y comunes con 4 artes), artista compuesto (`Dwarven Soldier-Asplund-Faith`) y palabra de arte (`Urzas Power Plant-Bug`). 387 variantes detectadas sobre 2201.

### Changed
- Filtro `Revisar` (`sync=review`) ahora muestra solo variantes **pendientes**: con variante Goldfish y (sin imagen o con set distinto al del Excel). Las variantes ya bien sincronizadas no aparecen, así el número baja a medida que se corrigen. Vale para el botón en `/admin` y el KPI del dashboard (`needsReview` en `src/lib/mtg-sets.ts`).
- `resolveVariantIfNeeded`: variante de una letra sin match por `collector_number` queda pendiente en vez de adivinar por artista.
- Detección de variante multi-palabra (`Urzas Power Plant-Rock in Pot`) con guardias (no rompe `Tin-Wing Chimera` ni `Snow-Covered Island`).
- Prints filtradas por set en el servidor (`oracleid + e:set`): `prints_search_uri` pagina de a 175 (nuevo a viejo) y para cartas viejas con muchas impresiones (básicas, staples) la primera página no traía el set → picker vacío y variantes no resueltas. Vale para sync y picker.
- Verificado con el usuario que `A/B/C/D` de básicas NO equivale al orden de collector (ej. `Forest-A` Ice Age ≠ `380`): las ~105 básicas entran en Revisar y se resuelven a mano con el picker (elegir arte en básica marca revisada sola).
- Grid del admin: botón de resync en cada carta (abre picker si tiene variante).
- Grid del admin: botón de editar al lado del resync (abre el formulario).
- Modal de detalle en admin: botones Sincronizar y Editar.
- Grid del admin: icono marcar revisada (gris con guión / verde con tilde).
- Filtro Revisada (Check / Sin revisar) en admin reemplaza al filtro Tipo (sin uso).
- Tabla del admin: icono marcar revisada en Acciones.
- Picker de variantes: link Goldfish clickeable en nueva pestaña.
- `reviewed boolean` en `cards` (migración idempotente en `schema.sql`): botón "Marcar revisada" en el modal del admin; elegir arte en el picker marca revisada (solo art-words Urza); el sync resetea la marca si cambia el arte y el formulario si cambia edición/goldfish.

### Changed
- `needsReview` v2: flag sin imagen, **cualquier** set distinto al del Excel (con o sin variante, ej `Brown Ouphe` en `mrd`), artes por dibujo de Urza (manual obligado) y letra cuyo collector no termina en ella (salvo básicas, que comparten número). Sobre datos actuales detecta 63 (2 + 13 + 48).

### Removed
- Scripts de fix puntuales que no funcionaron (`scripts/fix-*.mjs`, `scripts/generate-fix-all.mjs`) y SQL generados (`supabase/fix_324.sql`, `supabase/fix_AB.sql`).

### Changed
- `AGENTS.md` — workflow ahora exige actualizar `ROADMAP.md` junto a `CHANGELOG.md`.

## [0.3.0] - 2026-09-01

### Added
- `supabase/schema.sql` — campo `goldfish_url text`, `rarity` acepta `basic`, `condition` nullable.
- `scripts/import-xlsx.mjs` — importa `coleccion.xlsx` (3 pestañas, 2209 filas -> 2201 únicas tras agrupar duplicados exactos), genera `supabase/seed_import.sql` + `seed_import.json`. `goldfish_url` se preserva como referencia canónica.
- Catálogo agrupado por `goldfish_url` con total global + desglose por idioma (`ES x / EN x`) en `CardGrid`/`CardTable`.

### Changed
- `src/types/card.ts` — añade `basic` y `goldfish_url`.
- `src/pages/CatalogPage.tsx` — agrupa por `goldfish_url` (no por `owner`), oculta filtro `owner` en público.
- `src/components/admin/CardForm.tsx` — añade campo Goldfish, permite `condition` vacía y `basic`.
- `src/components/public/CardDetail.tsx` — muestra link Goldfish y desglose de idiomas.

### Removed
- Ruido de precio `Precio`/`Total` (ahora `price_usd=null`, sync Scryfall futuro).

## [0.2.0] - 2026-09-01

### Added
- Auth Admin con Supabase Auth (email/password, 1 owner): `src/context/AuthContext.tsx`, `src/pages/LoginPage.tsx`, `src/components/auth/ProtectedRoute.tsx`.
- Rutas privadas: `/` catálogo público sin botón Admin, `/admin` protegida y `/admin/login`. Acceso solo conociendo ruta + sesión válida.

### Changed
- `supabase/schema.sql` — RLS de escritura ahora exige `auth.role() = 'authenticated'` (antes `true`).
- `src/App.tsx` — refactorizado a `react-router-dom` (BrowserRouter/Routes). Catálogo y Admin separados en `src/pages/CatalogPage.tsx` y `src/pages/AdminPage.tsx`.

### Security
- Admin ya no se expone en navegación pública; todo el código admin queda tras `ProtectedRoute`.

## [0.1.0] - 2026-08-31

### Added
- Configuración inicial del proyecto: Vite 6 + React 19 + TypeScript 6 (strict) + Tailwind CSS 4 + lucide-react.
- Integración Supabase (`@supabase/supabase-js`) y servicio Scryfall con rate-limit y cache.
- Esquema de base de datos `supabase/schema.sql` (tabla `cards`, índices, RLS, triggers).
- Arquitectura de documentación: `AGENTS.md`, `README.md`, `CHANGELOG.md`.
- Estructura base de carpetas: `components/ui`, `components/public`, `components/admin`, `lib`, `services`, `types`, `hooks`.
- UI base: navegación Catálogo/Admin, filtros avanzados, Grid/Tabla, detalle de carta y panel CRUD admin con sincronización Scryfall.
- Configuración de despliegue Netlify (`netlify.toml`) y variables de entorno (`.env.example`).

[Unreleased]: https://github.com/usuario/coleccion-mtg/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/usuario/coleccion-mtg/releases/tag/v0.1.0
