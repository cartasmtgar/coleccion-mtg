# Roadmap — Colección MTG Web + Admin

> **Fuente única de verdad para tareas pendientes, ideas y pospuestos.** Este archivo debe mantenerse actualizado en todo momento (ver `AGENTS.md:56`). Última actualización: 2026-09-25

## Estado actual — v0.4.0 (2026-09-25) — Sync programada de precios
- [x] **Script + workflow:** `scripts/sync-prices.mjs` (1366 versiones en 19 tandas bulk, solo diffs, `--dry-run` verificado OK) + `.github/workflows/sync-prices.yml` (cron cada 12h + manual). Llave maestra solo en Secrets.
- [x] **Fecha visible:** `sync_meta` + chip en catálogo/admin.
- [x] **Verificado 2026-09-25:** corrida manual en verde (1468 precios en 1ª corrida, 0 en 2ª = solo diffs), fecha guardada y legible. Grant `service_role` agregado (faltaba) + workflow en node 24.

## Estado actual — v0.3.2 (2026-09-07) — Sync respeta edición + arte exacto
- [x] **Fix variantes:** `resolveVariantIfNeeded` filtra por set antes de buscar `A/B`/artista; sin fallback a otros sets (antes `Reprisal-B` → `wc02`, `Phyrexian War Beast-B` → `dkm`, `Torture-A` → `ptc`, `Casting of Bones-B`/`Lat-Nam's Legacy` → `cst`). Si no hay arte exacto, queda pendiente en vez de guardar versión incorrecta.
- [x] **Mapa 2PS → itp** (Introductory Two-Player Set) + `parseGoldfishUrl` acepta apellidos de artista sin romper `Man-o-War`.
- [x] **Bulk verifica set** antes de guardar; `VariantPicker` estricto por set y ordenado por `collector_number`.
- [x] **Limpieza:** borrados `scripts/fix-*.mjs`, `scripts/generate-fix-all.mjs`, `supabase/fix_324.sql`, `supabase/fix_AB.sql`.
- [ ] **Pendiente usuario:** reiniciar server y pulsar `Sincronizar todo` en `/admin` para re-sincronizar las 2201 con el código corregido.

## Estado actual — v0.3.3 (2026-09-07) — Revisar solo pendientes + detección completa
- [x] **Detección completa (387 variantes):** letra `D`, artista compuesto (`Asplund-Faith`), palabra de arte (`Bug`, `Rock in Pot`). Falsos positivos fuera (`Man-o-War`, `Will-o'-the-Wisp`, Chimeras, `Snow-Covered`).
- [x] **Revisar = solo pendientes** (`needsReview`): variante + (sin imagen o set incorrecto). El número baja a medida que se corrigen.
- [x] **Sin adivinanzas:** letra sola sin match de `collector_number` queda pendiente.
- [x] **needsReview v2 (verificado con datos reales 2026-09-07):** flag cualquier set-mismatch (detectó `Brown Ouphe` en `mrd` y `Fountain of Youth` en `10e`, ambos errores de edición en Excel), artes Urza (13 filas a picker manual) y letra vs collector salvo básicas (48 filas stale que el re-sync corrige solo). Total actual: 63 → ~13 tras re-sync + fixes.
- [x] **Marcar revisada:** columna `reviewed` + botón en modal + auto-marca en picker (art-words) + reset en sync/form. Query pendiente usuario ↓.
- [ ] **Pendiente usuario:** (1) correr migración `alter table ... reviewed ...`; (2) reiniciar server + Ctrl+Shift+R, verificar `Con imagen` muestra 2201; (3) confirmar 2 fixes de edición y 13 conflictos Excel-vs-Goldfish; (4) `Sincronizar todo`; (5) picker manual para las 13 Urza (quedan marcadas y salen de Revisar).

## Estado actual — v0.1.0 (completado)
- [x] Scaffolding Vite 6 + React 19 + TypeScript 6 (strict) + Tailwind 4 + lucide-react
- [x] Supabase integración + `supabase/schema.sql` + RLS + mock fallback
- [x] Scryfall service con rate-limit/cache
- [x] Catálogo público: SearchFilters, CardGrid, CardTable, CardDetail (precios/legalidades)
- [x] Panel Admin: CRUD, CardForm, sync individual/masivo
- [x] ContactModal + navegación
- [x] `dev.bat` para dev local, GitHub `main` conectado
- [x] `dev.bat` + `react-router-dom` + Auth

## Estado actual — v0.2.0 (2026-09-01) — Auth y rutas privadas
- [x] **Auth Admin (Supabase Auth email/password, 1 owner)** — `src/context/AuthContext.tsx:1`, `src/pages/LoginPage.tsx:1`, `src/components/auth/ProtectedRoute.tsx:1`
- [x] Rutas separadas: `/` Catálogo público (sin botón Admin) y `/admin` protegida (login en `/admin/login`). Código admin solo accesible conociendo ruta + sesión.
- [x] RLS endurecido: `supabase/schema.sql:68` insert/update/delete ahora con `auth.role()='authenticated'` (antes `true`).
- [x] Admin desacoplado del catálogo: `src/pages/CatalogPage.tsx:1` y `src/pages/AdminPage.tsx:1`, `src/App.tsx:1` solo ruteo.

## Estado actual — v0.3.0 (2026-09-01) — Import XLSX y DB extendida
- [x] **DB extendida:** `rarity` acepta `basic` (Basic Land), `condition` nullable (vacío), nuevo campo `goldfish_url text` (referencia permanente, no se reemplaza con Scryfall). Migración idempotente en `supabase/schema.sql:11`.
- [x] **Tipos:** `src/types/card.ts:1` añade `basic` + `goldfish_url`, `condition` nullable.
- [x] **Import XLSX:** `scripts/import-xlsx.mjs:1` lee 3 pestañas (Pollo/Phil/Yupi -> `owner`), 2209 filas con nombre, agrupa duplicados exactos por clave completa `owner+goldfish_url+idioma+notas+...` (8 duplicados sumados), genera `supabase/seed_import.sql` (2201 filas únicas, 3499 unidades) + `seed_import.json`. Precio ignorado (`price_usd=null`), `goldfish_url` preservado.
- [x] **Catálogo agrupado:** `src/pages/CatalogPage.tsx:1` agrupa por `goldfish_url` (canónico) mostrando **total global + desglose por idioma** (ES x, EN x, PT x) en `CardGrid.tsx:1` / `CardTable.tsx:1` y detalle. Base mantiene filas por owner separadas, frontend suma automáticamente. `SearchFilters` oculta `owner` en catálogo.
- [x] **Admin:** `src/components/admin/CardForm.tsx:1` añade campo Goldfish y `basic`, `condition` opcional.

## Estado actual — v0.3.1 (2026-09-02) — Dashboard Admin
- [x] **Dashboard** `src/pages/DashboardPage.tsx:1` en `/admin/dashboard` (protegido): KPIs (únicas, unidades, valor, % sync), distribución por dueño (progreso), por rareza/idioma, top ediciones/tipos, top 5 valiosas y recientes. Diseño moderno con gradientes y animaciones hover. Link desde `/admin`.
- [x] **Admin UI:** catálogo abre en nueva pestaña (`ExternalLink`), paginación 50/100/250/500, iconos acciones grandes con tooltip.

## Próximas tareas — Prioridad Alta
- [x] **Ejecutar migración + seed en Supabase** — Completado 2201 filas (verificado).
- [ ] **Paginación + búsqueda server-side** — Pasar filtros a Supabase (`ilike`/`eq`) en lugar de filtrado cliente. Paginación cliente ya hecha (50/100/250/500).
- [ ] **Deploy Netlify pendiente** — Conectar repo, setear `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, verificar build prod. Ver `netlify.toml:1`.

## Prioridad Media
- [ ] **Filtros avanzados fidelignos** — Color identity (W/U/B/R/G), tipo compuesto, rango precio, año, scryfall_id nulo.
- [ ] **Edición inline en AdminTable** — Cantidad/condición editable sin abrir modal.
- [ ] **Historial de precios** — Guardar `price_history` y mostrar gráfico simple.
- [ ] **SEO + OG** — Metas dinámicas por carta, sitemap.
- [ ] **Validación y manejo de errores** — Toasts, estados loading/error consistentes, validación Zod en CardForm.

## Prioridad Baja / Ideas (Backlog)
- [ ] Exportar colección a CSV/PDF
- [ ] Wishlist / Favoritos (localStorage)
- [ ] Modo oscuro/claro toggle
- [ ] Internacionalización ES/EN
- [ ] PWA offline para ferias
- [ ] Integración directa con Scryfall `autocomplete` en CardForm

## Pospuestas (no hacer ahora)
- **Carrito / Pagos** — Explícitamente fuera de alcance (solo cotización vía Contacto). Reevaluar solo si cambia modelo de negocio.
- ~~**Deploy hasta tener Auth** — Decidido 2026-09-01: posponer Netlify público hasta proteger Admin.~~ **Resuelto en v0.2.0** — Auth implementado, deploy puede proceder.

## Cómo actualizar este archivo
1. Marcar `[x]` al completar y mover a `Estado actual` o `Changelog`.
2. Agregar nuevas ideas en `Prioridad Baja / Ideas` con fecha y quién la propuso.
3. Si una tarea se pospone, moverla a `Pospuestas` con razón y fecha.
4. Commit: `docs: actualiza ROADMAP` y actualizar `CHANGELOG.md:Unreleased` si aplica.

## Métricas / Definición de hecho
- `npm run build` pasa sin errores
- Sin `any` nuevos
- Componentes reutilizan `src/components/ui/*`
- Supabase queries tipadas con `Card`
