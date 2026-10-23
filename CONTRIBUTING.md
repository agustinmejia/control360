# Guía de contribución

## Requisitos

- Node.js 22 (`.nvmrc`) y pnpm 10 (`corepack enable`).
- Docker (para la base de datos local de Supabase).

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local        # completar valores (ver abajo)
pnpm db:start                     # Supabase local completo (API + Auth + Postgres)
pnpm exec supabase status         # muestra la URL y la clave pública locales
pnpm dev                          # http://localhost:3000
```

Pon en `.env.local` la _API URL_ y la _Publishable key_ que muestra `supabase status`.
Para trabajar solo con la base de datos (sin API), basta `pnpm exec supabase db start`.

## Comandos

| Comando                                        | Qué hace                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`                                     | Servidor de desarrollo                                                    |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | Calidad de código                                                         |
| `pnpm test`                                    | Pruebas unitarias (Vitest)                                                |
| `pnpm build && pnpm test:e2e`                  | Pruebas end-to-end (Playwright) en móvil, tablet y escritorio             |
| `pnpm check:secrets`                           | Verifica que ningún secreto llegue al bundle del navegador (tras `build`) |
| `pnpm db:reset`                                | Recrea la base local aplicando todas las migraciones + `seed.sql`         |
| `pnpm db:test`                                 | Pruebas de base de datos (pgTAP)                                          |
| `pnpm db:types`                                | Regenera `src/lib/supabase/database.types.ts`                             |

> Si Playwright no encuentra su navegador y ya tienes Chromium instalado, usa
> `PW_CHROMIUM_PATH=/ruta/a/chrome pnpm test:e2e`, o instala con `pnpm exec playwright install chromium`.

## Estructura

```
src/
  app/                 rutas (App Router). (app)/ = área autenticada con el shell
  components/ui/       sistema de diseño (componentes propios con Tailwind)
  components/layout/   shell, navegación, tema
  config/              navegación y configuración estática
  lib/                 env, errores, Result, logger, formatos, fechas, clientes Supabase
  modules/<modulo>/    dominio, esquemas Zod, consultas, acciones y componentes de cada módulo
supabase/
  migrations/          SQL versionado (única forma de cambiar el esquema)
  tests/database/      pruebas pgTAP
e2e/                   pruebas Playwright
docs/roadmap/          análisis, roadmap y decisiones
docs/adr/              registros de decisiones de arquitectura
```

## Reglas del proyecto

1. **Código en inglés, interfaz y mensajes en español** (Bolivia: `Bs 1.234,50`, fechas `dd/mm/aaaa`, zona `America/La_Paz`).
2. **La integridad vive en PostgreSQL.** Operaciones que tocan varias tablas → una función SQL transaccional. El frontend valida para la experiencia, la base de datos decide.
3. **Nada se borra.** Dinero: solo asientos inversos. Datos maestros: borrado lógico (desactivar) con motivo. No hay `DELETE` para usuarios.
4. **Toda tabla de negocio:** columnas `created_at, created_by, updated_at, updated_by`, RLS habilitado, pruebas pgTAP de permisos y `select app.enable_tracking('public.tabla', 'modulo', 'columnas_criticas');` para la bitácora.
5. **Mutaciones:** Server Action → `runAction(schema, input, handler)` → `Result<T>`. Errores de la BD con `hint` = código de `src/lib/errors.ts`.
6. **Secretos:** solo `NEXT_PUBLIC_*` llega al navegador. `SUPABASE_SECRET_KEY` jamás se importa en código de cliente.
7. **Dinero y cantidades** como `numeric` en la BD; nunca se calculan totales oficiales con `number` en el cliente.
8. **Cada pantalla** tiene estados de carga, vacío, error y éxito, y funciona a 360 px.

## Base de datos y migraciones

- Crear una migración: `pnpm exec supabase migration new <nombre>` y escribir SQL.
- Probar desde cero: `pnpm db:reset && pnpm db:test`.
- **Staging:** el workflow `Migraciones` aplica las migraciones al fusionar en `main`.
- **Producción:** ejecutar manualmente el workflow `Migraciones` con `target = production` (requiere aprobación del environment).
- Secretos por environment de GitHub (`staging`, `production`): `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`. Sin ellos, el workflow se omite.
- Nunca cambiar el esquema de producción desde el panel de Supabase.

## Flujo de trabajo

Rama por tarea → PR con la plantilla → CI verde (app + base de datos) → revisión → merge a `main`.
Vercel genera una _preview_ por PR y despliega producción desde `main`.
