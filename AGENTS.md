<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Control360 · reglas del proyecto

Lee `CONTRIBUTING.md` (sección "Reglas del proyecto") y `docs/roadmap/08-decisiones-del-nucleo.md` antes de cambiar código o esquema. Resumen: integridad en PostgreSQL, nada se borra (asientos inversos / borrado lógico con motivo), toda tabla de negocio con RLS + pgTAP + `app.enable_tracking`, interfaz en español de Bolivia.
