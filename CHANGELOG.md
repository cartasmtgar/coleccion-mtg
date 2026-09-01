# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Pendiente de definir próximos cambios.

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
