# Roadmap — Colección MTG Web + Admin

> **Fuente única de verdad para tareas pendientes, ideas y pospuestos.** Este archivo debe mantenerse actualizado en todo momento (ver `AGENTS.md:56`). Última actualización: 2026-09-01

## Estado actual — v0.1.0 (completado)
- [x] Scaffolding Vite 6 + React 19 + TypeScript 6 (strict) + Tailwind 4 + lucide-react
- [x] Supabase integración + `supabase/schema.sql` + RLS + mock fallback
- [x] Scryfall service con rate-limit/cache
- [x] Catálogo público: SearchFilters, CardGrid, CardTable, CardDetail (precios/legalidades)
- [x] Panel Admin: CRUD, CardForm, sync individual/masivo
- [x] ContactModal + navegación Catálogo/Admin
- [x] `dev.bat` para dev local, GitHub `main` conectado

## Próximas tareas — Prioridad Alta
- [ ] **Auth Admin** — Proteger `/admin` con login Supabase Auth (email+password). Migrar políticas RLS de `using (true)` a `auth.role() = 'authenticated'`. Afecta `src/lib/supabase.ts:1` y `supabase/schema.sql:1`.
- [ ] **Import masivo desde Excel/CSV** — Parser para migrar la hoja original (mapeo columnas -> `Card`). UI en Admin para upload + preview + validación.
- [ ] **Paginación + búsqueda server-side** — Pasar filtros a Supabase (`ilike`/`eq`) en lugar de filtrado cliente. Necesario con >500 cartas.
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
- **Deploy hasta tener Auth** — Decidido 2026-09-01: posponer Netlify público hasta proteger Admin. Razón: evitar exposición de escritura sin auth.

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
