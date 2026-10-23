# ADR 0002 · Supabase (PostgreSQL) y Vercel

- **Estado:** aceptada (2026-10-23)
- **Decisión:** Supabase como base de datos, autenticación y almacenamiento; Next.js desplegado en Vercel por el propietario. Región de Supabase recomendada: São Paulo (`sa-east-1`).
- **Consecuencias:** variables de entorno documentadas en `.env.example`; migraciones aplicadas por GitHub Actions, no por Vercel; la clave secreta de Supabase nunca llega al navegador (chequeo automático `pnpm check:secrets`).
