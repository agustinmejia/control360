# ADR 0001 · Empresa única por despliegue, con sucursales

- **Estado:** aceptada (2026-10-23)
- **Contexto:** el propietario confirmó una sola empresa por despliegue, con varias sucursales e inventarios.
- **Decisión:** sin `organization_id` en las tablas. Configuración de la empresa en una tabla de fila única; `branches` (sucursales) e `inventories.branch_id`. Acceso por sucursal previsto (`user_branches`) para cuando se necesite.
- **Consecuencias:** RLS más simple (rol del usuario). Para servir a otra empresa se hace otro despliegue (otro proyecto Supabase), sin mezclar datos.
- **Referencia:** `docs/roadmap/08-decisiones-del-nucleo.md` §1.
