# 07 · Plan del primer bloque (B1 · Fundamentos técnicos)

> B0 (análisis) queda cubierto por estos documentos. El **primer bloque de implementación es B1**: EPIC-002, EPIC-003, EPIC-004 y EPIC-005.
> Resultado esperado: un esqueleto **desplegado en staging**, navegable en móvil y escritorio, con base de datos versionada y calidad automatizada. **No incluye funcionalidades de negocio** ni datos reales.

## 1. Condiciones para comenzar

| # | Condición | Responsable | Estado |
|---|---|---|---|
| C-1 | Documentos 01–07 revisados; decisiones del `06` §5 aprobadas o con valor provisional aceptado | Propietario | ✅ Aprobado (2026-10-23), salvo el punto 4 |
| C-2 | P-19: titular de las cuentas (GitHub, Supabase, Vercel, dominio) y forma de pago definidos | Propietario | ✅ El propietario gestiona Vercel y Supabase |
| C-3 | D-03 hosting confirmado (recomendado: Vercel + Supabase `sa-east-1`) | Propietario + técnico | ✅ Vercel + Supabase |
| C-4 | Acceso de escritura al repositorio `control360` y a las cuentas para el equipo técnico | Propietario | Pendiente |
| C-5 | Nombre de la app, logo en buena resolución (idealmente SVG o PNG ≥ 1024 px) y colores de marca | Propietario | Pendiente (se puede usar el logo embebido del prototipo provisionalmente) |
| C-6 | Solicitud de un respaldo JSON real del prototipo (para B7, no bloquea B1) | Propietario | Pendiente |

## 2. Alcance concreto de la entrega

**Incluye**
- Proyecto Next.js (App Router) + TypeScript estricto con la estructura de carpetas de `05` §2.1.
- Lint, formato, *pre-commit*, plantilla de PR, `CONTRIBUTING.md`, `.env.example`, carpeta `docs/adr/` con las decisiones D-01 a D-03 registradas.
- Sistema de diseño base (tokens claro/oscuro, componentes de formulario, tabla/tarjeta, estados, toast, diálogo), página `/dev/ui`.
- *Shell* autenticable vacío: layout con navegación inferior (móvil) y lateral (escritorio) con entradas deshabilitadas "Próximamente"; páginas 404 y de error.
- Manifiesto PWA mínimo e iconos (sin service worker).
- Supabase local (CLI), proyectos de staging y producción, clientes `@supabase/ssr`, migración inicial (esquema `app`, `set_updated_at`, extensiones), semilla vacía, tipos generados.
- `Result`, catálogo de errores, logger de servidor, utilidades de formato (`Bs`, cantidades, fechas en `America/La_Paz`).
- Pruebas: Vitest, pgTAP y Playwright configurados con al menos una prueba cada uno.
- CI en GitHub Actions y despliegue en Vercel (preview por PR, producción en `main` con protección de rama).

**No incluye**
- Login, usuarios, roles (B2), tablas de negocio (B3+), service worker (B7), importación de datos.

## 3. Tareas ordenadas

| # | Tarea | Épica | Depende de | Esfuerzo |
|---|---|---|---|---|
| T-01 | Crear proyecto Next.js + TS estricto, fijar versión de Node y gestor de paquetes; estructura de carpetas | 002 | C-4 | XS |
| T-02 | ESLint (next, typescript, jsx-a11y), Prettier, scripts `lint/typecheck/format`, *pre-commit* | 002 | T-01 | XS |
| T-03 | `CONTRIBUTING.md`, `.env.example` (URL y clave pública de Supabase, clave `service_role` solo de servidor, URL del sitio; documentado para Vercel), plantilla de PR, `docs/adr/0001…0003` | 002 | T-01 | XS |
| T-04 | Vitest + primera prueba; utilidades `formatMoney`, `formatQty`, `formatDate` con pruebas (coma decimal, `Bs`, zona horaria) | 005 | T-01 | S |
| T-05 | GitHub Actions: instalar, lint, typecheck, unit, build | 005 | T-02, T-04 | S |
| T-06 | Supabase CLI local, `config.toml`, migración inicial, `seed.sql`, script `db:reset` | 004 | T-01 | S |
| T-07 | Clientes Supabase `server`/`browser`/`middleware` (`@supabase/ssr`), variables por entorno | 004 | T-06 | S |
| T-08 | Generación de tipos y verificación en CI (sin diferencias) | 004 | T-05, T-06 | XS |
| T-09 | pgTAP configurado + prueba de humo; job de CI con `supabase db reset` + pruebas | 005 | T-05, T-06 | S |
| T-10 | Crear proyectos Supabase staging/producción (`sa-east-1`) y secretos en GitHub/Vercel; job que aplica migraciones a staging al fusionar en `main` | 004 | C-2, C-3, T-09 | S |
| T-11 | (Propietario) Proyecto Vercel conectado: previews por PR, producción en `main`, protección de rama | 005 | C-2, T-05 | XS |
| T-12 | Tailwind + shadcn/ui, tokens claro/oscuro, tipografía, conmutador de tema | 003 | T-01 | S |
| T-13 | Componentes base: botón, campo, número/moneda, fecha, select, combobox, diálogo de confirmación, toast, estados vacío/carga/error, encabezado de página, tabla ↔ tarjetas | 003 | T-12, T-04 | M |
| T-14 | *Shell*: layout responsive con navegación inferior/lateral, rutas placeholder, 404, `error.tsx` global | 003 | T-13 | S |
| T-15 | `Result`, catálogo de errores de dominio en español, logger de servidor, ejemplo de Server Action con validación Zod y error de campo | 005 | T-07, T-13 | S |
| T-16 | Manifiesto PWA mínimo + iconos (192, 512, maskable, Apple) a partir del logo | 003 | C-5, T-14 | XS |
| T-17 | Playwright: prueba de humo del *shell* a 360/768/1280 px con capturas; job en CI contra la preview | 005 | T-11, T-14 | S |
| T-18 | Chequeo de CI que falla si la clave `service_role` o un secreto aparece en el bundle del cliente | 005 | T-05, T-07 | XS |
| T-19 | Página `/dev/ui` (solo fuera de producción) con el catálogo de componentes | 003 | T-13 | XS |
| T-20 | Demostración al propietario en staging y ajustes visuales | — | todas | S |

**Ruta crítica:** T-01 → T-06 → T-09 → T-10 (requiere C-2/C-3) y T-01 → T-12 → T-13 → T-14 → T-17. Las cuentas (C-2) son el único bloqueo externo; T-01–T-09 y T-12–T-15 pueden avanzar en paralelo mientras tanto, en local.

## 4. Pruebas del bloque

| Prueba | Tipo | Criterio |
|---|---|---|
| Formatos de dinero, cantidad y fecha | Unitaria (Vitest) | `formatMoney(1234.5)` = `Bs 1.234,50`; fechas en `America/La_Paz` independientemente de la zona del servidor. |
| Validación de ejemplo (Zod) | Unitaria | Errores de campo en español. |
| Migración inicial | pgTAP | `supabase db reset` sin errores; función `set_updated_at` existe y funciona. |
| Tipos generados | CI | Sin diferencias con lo comprometido. |
| *Shell* responsive | e2e (Playwright) | Sin desplazamiento horizontal a 360 px; navegación inferior en móvil y lateral en ≥ 1024 px; capturas archivadas. |
| Accesibilidad básica | e2e + lint | `jsx-a11y` sin errores; foco visible; objetivos ≥ 44 px en navegación. |
| Seguridad de secretos | CI | El chequeo T-18 falla con una clave de prueba inyectada y pasa sin ella. |
| Despliegue | Manual | Una PR genera preview; al fusionar, producción se actualiza y las migraciones llegan a staging. |

## 5. Criterios de aceptación del bloque

1. La URL de **staging** muestra el *shell* con navegación funcional en un teléfono real y en escritorio, en modo claro y oscuro.
2. `/dev/ui` muestra todos los componentes base con sus estados (carga, vacío, error, éxito, deshabilitado).
3. Un desarrollador nuevo levanta el entorno local siguiendo solo `CONTRIBUTING.md`.
4. CI ejecuta lint, typecheck, unitarias, pgTAP, build y e2e de humo; una PR con un error en cualquiera de ellos no se puede fusionar.
5. Las migraciones solo llegan a staging/producción mediante CI; producción requiere aprobación manual.
6. Ningún secreto de servidor aparece en el código del cliente (verificado por T-18).
7. Las decisiones D-01 a D-03 están registradas como ADR.
8. El propietario aprueba la apariencia general (colores, tipografía, logo) en la demostración T-20.

## 6. Qué sigue

Al cerrar B1 comienza **B2** (EPIC-006 a EPIC-008): autenticación por invitación, organización "Grupo Pecuario", roles y RLS con su matriz de pruebas, auditoría y numeración. Antes de iniciar B2 se necesita la respuesta a P-11 (usuarios y funciones) o la aceptación de la matriz de roles propuesta.

## 7. Estado de avance (2026-10-23)

| Tarea | Estado |
|---|---|
| T-01 a T-09, T-12 a T-19 | ✅ Hechas y verificadas localmente: lint, typecheck, 31 pruebas unitarias, 17 pruebas pgTAP, build, chequeo de secretos y 22 pruebas e2e (móvil, tablet, escritorio). |
| T-10 | ⏳ Pendiente del propietario: crear los proyectos Supabase (staging y producción) y cargar los secretos `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` en los environments `staging` y `production` de GitHub. El workflow `Migraciones` ya está listo y se omite mientras falten. |
| T-11 | ⏳ Pendiente del propietario: conectar Vercel con las variables de `.env.example`. |
| T-20 | ⏳ Demostración en staging cuando T-10 y T-11 estén listas. |

**Cambios respecto al plan:** shadcn/ui no se pudo descargar desde el entorno de desarrollo (dominio bloqueado); los componentes base se escribieron a mano con el mismo enfoque (código propio, Tailwind). El combobox con búsqueda se construirá en B3, cuando lo necesite el catálogo de productos. La bitácora de acciones (`app.audit_log`) se adelantó a B1 según `08` §8.
