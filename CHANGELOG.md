# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- `ROADMAP.md` como fuente única de tareas pendientes/ideas/pospuestas con regla de actualización continua.
- `dev.bat` para iniciar servidor local con doble click y apertura automática del navegador.

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
