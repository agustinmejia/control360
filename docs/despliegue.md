# Despliegue: Supabase + Vercel

Pasos para poner Control360 en línea. Repetir para **staging** y **producción** (dos proyectos de Supabase separados).

## 1. Proyecto de Supabase

1. Crear el proyecto en <https://supabase.com/dashboard> — región **South America (São Paulo)**.
2. Guardar la contraseña de la base de datos (se usa en GitHub Actions).
3. Anotar de _Project Settings › API Keys_:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** → `SUPABASE_SECRET_KEY` (solo servidor)
   - **Project ref** (el identificador en la URL) → `SUPABASE_PROJECT_REF`

## 2. Aplicar las migraciones

Opción A (recomendada): GitHub Actions.

- En GitHub › _Settings › Environments_, crear `staging` y `production` (en producción, activar _Required reviewers_).
- En cada environment, agregar los secretos: `SUPABASE_ACCESS_TOKEN` (token personal de Supabase, _Account › Access Tokens_), `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.
- Staging se actualiza solo al fusionar en `main`; producción con _Actions › Migraciones › Run workflow › production_.

Opción B (manual, una vez): `pnpm exec supabase link --project-ref <ref>` y `pnpm exec supabase db push`.

> `supabase db push` **no** carga `supabase/seed.sql` (usuarios de prueba): esos datos son solo para desarrollo local.

## 3. Configuración de Auth (Dashboard › Authentication)

| Ajuste                                             | Valor                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| _Sign In / Providers › Allow new users to sign up_ | **Desactivado** (solo por invitación)                                                                                                      |
| _Email_ › _Confirm email_                          | Activado                                                                                                                                   |
| _Passwords_ › longitud mínima                      | 8, con letras y números                                                                                                                    |
| _URL Configuration › Site URL_                     | `https://<dominio-de-la-app>`                                                                                                              |
| _URL Configuration › Redirect URLs_                | `https://<dominio>/auth/confirm`, y para previews `https://*-<equipo>.vercel.app/auth/confirm`                                             |
| _Emails › SMTP Settings_                           | Un proveedor propio (Resend, SendGrid, etc.). El correo incluido de Supabase tiene un límite muy bajo y no sirve para invitaciones reales. |

**Plantillas de correo** (_Emails › Templates_): copiar el contenido de
`supabase/templates/invite.html` (Invite user) y `supabase/templates/recovery.html` (Reset password),
con los asuntos «Invitación a Control360» y «Recupera tu contraseña de Control360».
Los enlaces usan `{{ .SiteURL }}/auth/confirm?token_hash=…`, que es la ruta que procesa la app.

## 4. Primer usuario (propietario)

El **primer usuario creado** queda automáticamente como **propietario**:

1. Dashboard › Authentication › Users › _Add user_ › _Send invitation_ con el correo del propietario
   (o _Create new user_ con contraseña y _Auto confirm_).
2. El propietario ingresa a la app; desde _Configuración › Usuarios_ invita al resto del equipo.

## 5. Vercel

1. Importar el repositorio (framework Next.js; pnpm se detecta solo).
2. _Settings › Environment Variables_ (Production y Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = dominio de la app (en Preview, la URL de staging)
   - `SUPABASE_SECRET_KEY` marcada como **Sensitive**
3. Producción debe apuntar al proyecto Supabase de producción; Preview, al de staging.

## 6. Verificación después de desplegar

- [ ] `/login` muestra el nombre de la empresa.
- [ ] El propietario ingresa y ve _Configuración_.
- [ ] Una invitación llega por correo y el enlace lleva a «Crea tu contraseña».
- [ ] _Configuración › Bitácora_ registra el inicio de sesión y la invitación.
- [ ] «¿Olvidaste tu contraseña?» envía el correo de recuperación.
