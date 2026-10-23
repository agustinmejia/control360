# Control360 · Grupo Pecuario

Aplicación web (PWA) de gestión operativa para Grupo Pecuario: inventario, ventas, cobros, compras, pagos, cargo a rendir y operaciones ganaderas.

- **Stack:** Next.js 16 (App Router) + TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, RLS) · Vercel.
- **Roadmap y decisiones:** [`docs/roadmap/`](docs/roadmap/README.md) — empezar por [08 · Decisiones del núcleo](docs/roadmap/08-decisiones-del-nucleo.md).
- **Prototipo de referencia:** [`prototipo/`](prototipo/) (solo referencia funcional; no es fuente de lógica).
- **Contribuir / entorno local:** [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Estado

- **Bloque 1** (fundamentos técnicos): completo.
- **Bloque 2** (autenticación, empresa, sucursales, usuarios, roles, RLS, bitácora): completo.
- **Bloque 3** (inventario: catálogo con presentaciones, precios por inventario, entradas, salidas, ajustes, traspasos, fraccionamiento, kardex, existencias): completo.

Todo probado contra Supabase local; pendiente de conectar al proyecto remoto.

Los módulos de negocio se agregan por bloques según el roadmap.

## Despliegue

Ver [`docs/despliegue.md`](docs/despliegue.md): proyecto Supabase, migraciones, configuración de Auth y correos, primer propietario y variables de Vercel.

## Desarrollo local

```bash
pnpm db:start   # Supabase local con usuarios de prueba (supabase/seed.sql, contraseña Control360dev)
pnpm dev
```
