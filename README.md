# Control360 · Grupo Pecuario

Aplicación web (PWA) de gestión operativa para Grupo Pecuario: inventario, ventas, cobros, compras, pagos, cargo a rendir y operaciones ganaderas.

- **Stack:** Next.js 16 (App Router) + TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, RLS) · Vercel.
- **Roadmap y decisiones:** [`docs/roadmap/`](docs/roadmap/README.md) — empezar por [08 · Decisiones del núcleo](docs/roadmap/08-decisiones-del-nucleo.md).
- **Prototipo de referencia:** [`prototipo/`](prototipo/) (solo referencia funcional; no es fuente de lógica).
- **Contribuir / entorno local:** [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Estado

Bloque 1 (fundamentos técnicos) en curso: shell responsive, sistema de diseño, base de datos con bitácora de acciones, pruebas y CI. Los módulos de negocio se agregan por bloques según el roadmap.

## Despliegue (Vercel)

1. Importar el repositorio en Vercel (framework: Next.js; gestor: pnpm, detectado por `packageManager`).
2. Configurar las variables de [`.env.example`](.env.example) en _Production_ y _Preview_.
3. Las migraciones de base de datos **no** las aplica Vercel: las aplica el workflow `Migraciones` de GitHub Actions (ver `CONTRIBUTING.md`).
