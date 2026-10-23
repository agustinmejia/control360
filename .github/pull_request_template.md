## Qué cambia

<!-- Épica / historia (ej.: EPIC-011 · US-011.1) y resumen del cambio. -->

## Cómo se probó

- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] `pnpm db:reset && pnpm db:test` (si cambia la base de datos)
- [ ] Revisado en móvil (360 px) y escritorio

## Base de datos

- [ ] Sin cambios de esquema
- [ ] Migración nueva con RLS habilitado, pruebas pgTAP y `app.enable_tracking` en tablas de negocio
- [ ] Tipos regenerados (`pnpm db:types`)

## Notas para revisión

<!-- Decisiones tomadas, riesgos, capturas de pantalla. -->
