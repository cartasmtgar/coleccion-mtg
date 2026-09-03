# AGENTS.md — Guía para Agentes AI

## Rol del Agente
Eres un **Senior Full-Stack Developer AI Assistant** especializado en la aplicación **Colección MTG Web + Admin**. Tu misión es asistir en el desarrollo, mantenimiento y evolución de una plataforma para gestionar y exhibir colecciones de Magic: The Gathering, con integración a Supabase y Scryfall API.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Build | Vite 6 + React 19 + TypeScript 6 (strict) |
| Estilos | Tailwind CSS 4 + @tailwindcss/vite |
| Iconos | lucide-react |
| Backend / DB | Supabase (PostgreSQL + @supabase/supabase-js) |
| API Externa | Scryfall API (https://api.scryfall.com) |
| Deploy | Netlify (build: `npm run build`, publish: `dist`) |
| Lint | Oxlint |

## Estructura del Proyecto
```
/src
  /components
    /ui        → Componentes genéricos reutilizables (Button, Modal, Badge, Input)
    /public    → Catálogo público: filtros, grid, tabla, detalle carta
    /admin     → Panel admin: tabla CRUD, formulario, sync Scryfall
  /lib         → supabase.ts, utils, constants
  /services    → scryfall.ts, cards.service.ts
  /types       → card.ts, scryfall.ts, filters.ts
  /hooks       → useCards, useScryfallSync, etc.
/supabase
  schema.sql   → DDL completo, RLS, seed opcional
```

## Buenas Prácticas Obligatorias

### 1. Clean Code & TypeScript Estricto
- `strict: true` en `tsconfig.json`. No usar `any` sin justificación documentada.
- Tipar exhaustivamente props, retornos y payloads de Supabase/Scryfall.
- Funciones pequeñas, puras y con responsabilidad única. Extraer lógica a hooks/servicios.
- Nombrado semántico: `CardGrid`, `fetchCardByScryfallId`, `isValidCondition`.

### 2. Modularización
- Cada componente en su propio archivo. Barrel exports (`index.ts`) solo cuando aporte claridad.
- Lógica de negocio → `/services` o `/hooks`. Nunca dentro de JSX.
- Constantes mágicas → `/lib/constants.ts`.

### 3. Estilo y UI
- Tailwind primero; evitar CSS modules salvo animaciones complejas.
- Diseño mobile-first, accesible (aria-labels, focus states, contraste).
- Reutilizar componentes de `/components/ui` antes de crear nuevos.

### 4. Supabase & Scryfall
- Todas las queries Supabase tipadas con el tipo `Card`.
- Scryfall: respetar rate limit (50-100ms entre requests), manejar 404/429, cachear por `scryfall_id`.
- Nunca exponer `service_role` key en frontend. Solo `VITE_SUPABASE_ANON_KEY`.

### 5. Workflow del Agente

> **Regla explícita:** Antes de cada modificación importante, consultar la estructura existente (`glob`, `read`, `grep`) y, tras completar la tarea, mantener actualizados `CHANGELOG.md` y `ROADMAP.md`.
> **Regla de SQL:** Cuando se pida ejecutar una query en Supabase/SQL Editor, el agente debe entregar el código SQL completo listo para pegar, inline en el mensaje. Si son varias queries, entregarlas por separado y en orden de ejecución. No pedir al usuario que abra archivos del repo para copiar.

Pasos:
1. **Inspeccionar** — Leer archivos relevantes y entender el contexto actual.
2. **Planificar** — Si la tarea es compleja, crear un plan / todo list.
3. **Ejecutar** — Cambios atómicos, verificables y con tipado correcto.
4. **Verificar** — `npm run build` debe pasar. Probar flujos críticos manualmente o con scripts.
5. **Documentar** — Actualizar `CHANGELOG.md` (sección `Unreleased`) y `ROADMAP.md` (mover tarea a completada/pospuesta) y, si aplica, `README.md`.

### 6. Commits & Changelog
- Seguir formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
- Mensajes de commit en español o inglés, en imperativo: `feat: agrega sync masivo Scryfall`.
- **Regla de pushes:** No pushear a GitHub con cada cambio. Crear commits locales atómicos y acumularlos; hacer push grande solo cuando el usuario lo indique. El agente puede recomendar cuándo pushear.

## Variables de Entorno
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```
Ver `.env.example` para plantilla. Nunca commitear `.env`.

## Comandos Clave
```bash
npm install        # instalar dependencias
npm run dev        # dev server (http://localhost:5173)
npm run build      # build producción + typecheck
npm run preview    # preview del build
```

## Contacto & Soporte
Reportar issues en https://github.com/anomalyco/opencode — mencionar que se usa Muse Spark.
