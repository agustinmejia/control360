# 04 · Épicas e historias de usuario

> Formato de historia: *Como [perfil], quiero [acción], para [beneficio].* Criterios de aceptación en estilo **Dado / Cuando / Entonces** abreviado.
> Perfiles: **Propietario**, **Admin** (administrador), **Operador** (vendedor/almacén), **Consulta**, **Responsable** (de fondos), **Campo** (capataz).
> Referencias `H-xx` → defectos del prototipo (`01`); `P-xx` → preguntas de negocio y `D-xx` → decisiones (`06`).

## 0. Definition of Done común (aplica a todas las épicas)

Una historia está **terminada** cuando:

1. Cumple todos sus criterios de aceptación, demostrados en staging.
2. Los cambios de base de datos están en una migración versionada, aplicada desde cero (`supabase db reset`) sin errores, con tipos TypeScript regenerados.
3. Toda tabla nueva tiene RLS habilitado y pruebas pgTAP de permisos para cada rol relevante.
4. Toda operación que modifica más de una tabla se ejecuta en una función transaccional con pruebas de caso feliz y de error.
5. Las validaciones existen en el formulario (Zod) **y** en la base de datos (restricciones o RPC).
6. Las pantallas tienen estados de carga, vacío, error y éxito; son usables a 360 px y en escritorio; los campos tienen etiqueta y foco visible.
7. Lint, typecheck, pruebas unitarias, pgTAP y build pasan en CI; sin secretos en el código ni en variables `NEXT_PUBLIC_*`.
8. Las operaciones sensibles dejan registro de autor y fecha (y en `audit_log` cuando corresponda).
9. Revisión de código aprobada; documentación (decisiones, esquema) actualizada.

Una **épica** está terminada cuando todas sus historias P0 lo están, se cumplen sus *condiciones de completitud* y el propietario del producto la aceptó en una demostración.

---

# B0 · Análisis y definición funcional

## EPIC-001 · Auditoría y definición funcional
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** — · **Estado:** documentos entregados; falta validación del propietario.

- **Objetivo de negocio:** decidir qué se construye primero sin perder nada de lo que hoy funciona.
- **Problema:** el prototipo concentra reglas implícitas y términos sin definir.
- **Alcance:** auditoría, catálogo de funcionalidades, reglas, ambigüedades, MVP, criterios iniciales. **Excluye:** código, migraciones, despliegues.
- **Historias:**
  - **US-001.1** Como Propietario, quiero revisar el análisis del prototipo para confirmar que refleja cómo trabajamos.
    - Entonces cada hallazgo `H-xx` queda marcado como *confirmado*, *corregir* o *no aplica*.
  - **US-001.2** Como Propietario, quiero responder las preguntas de negocio para desbloquear el desarrollo.
    - Entonces las preguntas bloqueantes de B1–B4 (`06`, §4) tienen respuesta o un valor provisional aceptado por escrito.
  - **US-001.3** Como Propietario, quiero entregar un respaldo JSON real del prototipo (anonimizado si se prefiere) para validar el importador y los volúmenes.
- **Entidades:** ninguna. **Áreas:** documentación.
- **Riesgos:** respuestas tardías bloquean B3–B4 → registrar valores provisionales.
- **Pruebas:** revisión cruzada de consistencia entre documentos.
- **Completada cuando:** documentos aprobados, decisiones D-01 a D-05 tomadas y respaldo real recibido (o acordado que se recibirá antes de B7).

---

# B1 · Fundamentos técnicos

## EPIC-002 · Proyecto base y convenciones
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** EPIC-001

- **Objetivo de negocio:** que cualquier desarrollador pueda contribuir de forma consistente desde el primer día.
- **Problema:** el prototipo no tiene estructura, pruebas ni convenciones (H-20).
- **Incluye:** Next.js App Router + TypeScript estricto, ESLint, Prettier, alias de rutas, estructura de carpetas de `05` §2.1, convenciones de nombres (código en inglés, interfaz en español), plantilla de PR, `CONTRIBUTING.md`, `.env.example`, Node versionado (`.nvmrc`), gestor de paquetes fijado.
- **Excluye:** funcionalidades de negocio.
- **Historias:**
  - **US-002.1** Como desarrollador, quiero clonar el repositorio y levantar la app con un solo comando documentado.
    - Dado un equipo con Node y Docker, cuando sigo `CONTRIBUTING.md`, entonces la app abre en `localhost` con la BD local en ≤ 15 min.
  - **US-002.2** Como desarrollador, quiero reglas de lint y formato automáticas para no discutir estilo en revisiones.
    - Entonces `lint` y `format:check` fallan ante infracciones y corren en *pre-commit* y CI.
- **Tareas técnicas:** inicializar proyecto; configurar TS `strict`, `noUncheckedIndexedAccess`; ESLint (next, typescript, jsx-a11y); scripts `dev/build/lint/typecheck/test`; carpeta `docs/adr/` para decisiones.
- **Entidades:** ninguna. **Áreas:** repositorio, tooling.
- **Riesgos:** versiones mayores recientes de Next.js con cambios → fijar versión estable al iniciar.
- **Pruebas:** CI ejecuta lint + typecheck sobre el esqueleto.
- **Completada cuando:** un segundo desarrollador levanta el proyecto siguiendo solo la guía.

## EPIC-003 · Sistema de diseño y shell responsive
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-002

- **Objetivo de negocio:** una interfaz moderna, coherente y cómoda en el teléfono.
- **Problema:** estilos ad hoc y re-render completo en el prototipo; sin navegación adaptable a escritorio.
- **Incluye:** Tailwind + shadcn/ui; tokens de color claro/oscuro basados en la identidad actual y el logo; tipografía; componentes base (botón, campo, select, combobox con búsqueda, fecha, número/moneda, tabla ↔ tarjetas, diálogo de confirmación, toast, estados vacío/carga/error, encabezado de página); *shell* con navegación inferior (móvil) y lateral (≥ 768 px); página 404/error; manifiesto PWA mínimo (nombre, iconos, colores).
- **Excluye:** service worker (EPIC-024), pantallas de negocio.
- **Historias:**
  - **US-003.1** Como Operador, quiero navegar entre módulos con el pulgar en el teléfono.
    - Dado un teléfono de 360 px, entonces la navegación principal está al alcance inferior, con objetivos ≥ 44 px y sin desplazamiento horizontal.
  - **US-003.2** Como Admin, quiero en escritorio una navegación lateral y tablas amplias.
    - Dado ≥ 1024 px, entonces se muestra menú lateral y las listas en tabla.
  - **US-003.3** Como usuario, quiero que la app respete el modo oscuro de mi dispositivo y pueda cambiarlo.
  - **US-003.4** Como usuario, quiero ingresar montos y cantidades con el teclado numérico y ver formato `Bs 1.234,50`.
    - Entonces los campos de dinero usan `inputmode="decimal"`, aceptan coma decimal y muestran el formato boliviano.
- **Tareas técnicas:** página interna `/dev/ui` con catálogo de componentes; utilidades `formatMoney`, `formatQty`, `formatDate` con pruebas.
- **Entidades:** ninguna. **Áreas:** `components/ui`, `app/(app)/layout`.
- **Riesgos:** sobrediseño → limitar a componentes que usarán B2–B4.
- **Pruebas:** unitarias de formatos; capturas Playwright a 360/768/1280 px; revisión de contraste.
- **Completada cuando:** catálogo de componentes revisado por el propietario en móvil y escritorio.

## EPIC-004 · Supabase: entornos, migraciones y tipos
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** EPIC-002

- **Objetivo de negocio:** datos centralizados y cambios de esquema controlados.
- **Incluye:** Supabase CLI local; proyectos de staging y producción (región `sa-east-1`); variables por entorno; clientes `server`/`browser`/`middleware` con `@supabase/ssr`; primera migración (esquema `app`, extensiones, funciones utilitarias, `set_updated_at`); generación de tipos; `seed.sql` de desarrollo.
- **Excluye:** tablas de negocio.
- **Historias:**
  - **US-004.1** Como desarrollador, quiero recrear la BD local desde cero con un comando para trabajar con datos limpios.
    - Entonces `supabase db reset` aplica todas las migraciones y la semilla sin errores.
  - **US-004.2** Como responsable técnico, quiero que los cambios de esquema lleguen a staging solo por migraciones.
    - Entonces CI aplica migraciones a staging al fusionar en `main`; producción requiere aprobación manual.
- **Entidades:** ninguna de negocio. **Áreas:** `supabase/`, `lib/supabase`.
- **Riesgos:** fuga de `service_role` → solo en secretos de CI/servidor, verificado por un chequeo de CI que busca la clave en el bundle.
- **Pruebas:** pgTAP "hola mundo"; verificación de tipos generados sin diferencias en CI.
- **Completada cuando:** staging y producción creados, migración inicial aplicada a staging desde CI.

## EPIC-005 · Calidad y entrega continua
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-002, EPIC-004

- **Objetivo de negocio:** entregar seguido sin romper lo que funciona.
- **Incluye:** tipo `Result` y catálogo de errores de dominio (códigos → mensajes en español); manejo uniforme de errores en Server Actions y en `error.tsx`; registrador de eventos técnico (servidor) sin datos sensibles; Vitest; pgTAP; Playwright configurado; GitHub Actions (lint, typecheck, unit, db reset + pgTAP, build); despliegue Vercel (preview por PR, producción en `main`); protección de rama.
- **Excluye:** monitoreo avanzado (EPIC-032).
- **Historias:**
  - **US-005.1** Como usuario, quiero mensajes de error claros en español y la posibilidad de reintentar, para no perder lo que escribí.
    - Dado un error de red o de validación, entonces el formulario conserva los datos, marca el campo con problema y muestra un mensaje comprensible.
  - **US-005.2** Como responsable técnico, quiero que ninguna PR se fusione con pruebas fallando.
  - **US-005.3** Como Propietario, quiero ver cada cambio en una URL de prueba antes de que llegue a producción.
- **Áreas:** `lib/errors.ts`, `lib/result.ts`, `lib/logger.ts`, `.github/workflows`.
- **Riesgos:** CI lento con Docker → caché de imágenes; e2e solo en flujos críticos.
- **Pruebas:** la propia canalización; prueba de un error forzado visible en la UI.
- **Completada cuando:** una PR de ejemplo pasa por preview → revisión → producción con CI verde.

---

# B2 · Autenticación, organización y acceso

## EPIC-006 · Autenticación y perfiles
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** EPIC-003, EPIC-004

- **Objetivo de negocio:** que solo personas autorizadas accedan a la información del negocio.
- **Problema:** el prototipo no tiene usuarios ni autoría (H-21).
- **Incluye:** inicio de sesión con correo y contraseña; cierre de sesión; recuperación de contraseña; perfil (nombre, teléfono); protección de rutas en *middleware*; sesión persistente en el dispositivo; sin registro público.
- **Excluye:** inicio con Google/OTP por SMS (evaluables luego), 2FA (P2).
- **Historias:**
  - **US-006.1** Como usuario invitado, quiero establecer mi contraseña desde el correo de invitación e ingresar.
  - **US-006.2** Como usuario, quiero que la app recuerde mi sesión en mi teléfono para no ingresar cada vez.
    - Entonces la sesión se renueva automáticamente; cerrar sesión la invalida en ese dispositivo.
  - **US-006.3** Como usuario, quiero recuperar mi contraseña si la olvido.
  - **US-006.4** Como visitante sin sesión, al abrir cualquier ruta interna soy enviado a "Iniciar sesión" y luego vuelvo a la ruta pedida.
- **Entidades:** `auth.users`, `profiles`. **Áreas:** `app/(public)/login`, middleware.
- **Riesgos:** correos de Supabase con límite de envío → configurar SMTP propio antes de producción.
- **Pruebas:** e2e de login/logout/ruta protegida; pgTAP: un usuario solo lee/edita su perfil.
- **Completada cuando:** un usuario invitado en staging completa el ciclo invitación → ingreso → cierre.

## EPIC-007 · Organización, membresías, roles y RLS
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-006

- **Objetivo de negocio:** controlar qué puede ver y hacer cada persona; dejar el sistema listo para más negocios o sucursales.
- **Incluye:** `organizations` (nombre comercial, moneda BOB, zona horaria, logo); `memberships` con roles `owner/admin/operator/viewer` (D-04); invitación, cambio de rol y desactivación de usuarios; funciones `app.is_member`, `app.has_role`, `app.require_role`; plantilla de políticas RLS; selector de organización oculto si hay una sola (D-01).
- **Excluye:** UI multi-organización completa, permisos finos por inventario (P2).
- **Historias:**
  - **US-007.1** Como Propietario, quiero invitar a una persona por correo con un rol.
    - Cuando invito, entonces recibe un correo; mientras no acepte figura "Invitación pendiente"; puedo revocarla.
  - **US-007.2** Como Propietario, quiero cambiar el rol o desactivar a un usuario sin borrar su historial.
    - Entonces un usuario desactivado no puede ingresar, pero sus registros siguen mostrando su nombre.
  - **US-007.3** Como Consulta, quiero ver la información sin poder modificarla.
    - Entonces no veo botones de alta/anulación y cualquier intento directo a la API es rechazado por la BD.
  - **US-007.4** Como Propietario, quiero que siempre quede al menos un propietario activo.
- **Entidades:** `organizations`, `memberships`, `profiles`.
- **Áreas:** `supabase/migrations`, `modules/settings/users`, helpers RLS.
- **Riesgos:** políticas RLS incorrectas → matriz de pruebas obligatoria; recursión en políticas → helpers `security definer`.
- **Pruebas:** pgTAP con usuarios de cada rol y uno **de otra organización** sobre `select/insert/update/delete` de cada tabla.
- **Completada cuando:** matriz de permisos de `05` §3.2 verificada por pruebas automáticas.

## EPIC-008 · Auditoría y numeración de documentos
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** EPIC-007

- **Objetivo de negocio:** saber quién hizo qué y cuándo; documentos con número propio.
- **Problema:** H-01 (borrados sin rastro) y H-09 (números por posición).
- **Incluye:** columnas de autoría y trigger `set_updated_at`; tabla `audit_log` + trigger genérico; función `app.next_document_number(org, type, scope)`; convención de motivo obligatorio en anulaciones.
- **Excluye:** pantalla de consulta de auditoría (EPIC-032).
- **Historias:**
  - **US-008.1** Como Propietario, quiero que cada cambio de precio, anulación o cambio de rol quede registrado con autor, fecha, valor anterior y nuevo.
  - **US-008.2** Como Admin, quiero que ventas, compras, cobros y cargos tengan números correlativos sin repetir, aunque dos personas registren a la vez.
- **Entidades:** `audit_log`, `document_sequences`.
- **Riesgos:** volumen de auditoría → índices por `(organization_id, table_name, occurred_at)`; no auditar tablas de alto volumen sin necesidad.
- **Pruebas:** pgTAP: trigger registra cambios; numeración concurrente sin duplicados (dos sesiones).
- **Completada cuando:** cualquier tabla nueva puede activar auditoría y numeración con una línea en su migración.

---

# B3 · Inventario

## EPIC-009 · Inventarios y datos del negocio
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** EPIC-007

- **Objetivo de negocio:** separar grupos de productos (p. ej., "Insumos veterinarios") como hoy, pero sin perder datos al cambiar o borrar.
- **Problema:** inventarios intercambiados dentro de un JSON; eliminar uno borra todo.
- **Incluye:** configuración del negocio (nombre para reportes, logo, moneda, zona horaria); CRUD de inventarios (nombre único, descripción, permitir negativos sí/no, archivar); selector de inventario activo recordado por usuario; cabecera con negocio · inventario.
- **Excluye:** transferencias entre inventarios (EPIC-034), permisos por inventario.
- **Historias:**
  - **US-009.1** Como Admin, quiero crear un inventario con nombre propio.
    - Entonces no se admiten dos inventarios con el mismo nombre (sin distinguir mayúsculas).
  - **US-009.2** Como Operador, quiero cambiar de inventario desde la cabecera y que la app recuerde mi elección.
  - **US-009.3** Como Admin, quiero archivar un inventario que ya no se usa sin perder su historial.
    - Entonces deja de aparecer en el selector, pero sus reportes siguen consultables; no se puede borrar si tiene movimientos.
  - **US-009.4** Como Propietario, quiero definir el nombre del negocio y el logo que aparecen en reportes.
- **Entidades:** `organizations`, `inventories`. **Áreas:** `modules/inventory`, `modules/settings`.
- **Riesgos/decisiones:** D-02 (catálogo compartido o por inventario) define si los productos se crean dentro del inventario.
- **Pruebas:** pgTAP unicidad y RLS; e2e crear/cambiar/archivar.
- **Completada cuando:** existen dos inventarios con productos distintos y se alterna entre ellos sin mezclar datos.

## EPIC-010 · Catálogo: productos, categorías y unidades
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-009

- **Objetivo de negocio:** un catálogo ordenado y sin duplicados, con precios controlados.
- **Problema:** productos solo con nombre y precio; borrado en cascada (H-03); cantidades enteras (H-12).
- **Incluye:** productos (nombre, código opcional, categoría, unidad, precio de venta, stock mínimo, activo); categorías simples; unidades con "admite decimales" (semilla: Unidad, Kg, Litro, Bolsa, Quintal, Arroba, Caja, Paquete, Tonelada, Cabeza); búsqueda y filtros; desactivar en lugar de borrar; historial de precios (registro en auditoría; vista dedicada como mejora).
- **Excluye:** variantes, códigos de barras, listas de precios por cliente, costo en el producto.
- **Historias:**
  - **US-010.1** Como Admin, quiero dar de alta un producto con unidad y precio de venta.
    - Entonces el nombre es único dentro de su alcance (D-02); el precio es ≥ 0 con 2 decimales.
  - **US-010.2** Como Admin, quiero cargar el **saldo inicial** de un producto como movimiento de apertura (con costo opcional), distinto de una compra.
  - **US-010.3** Como Admin, quiero cambiar el precio de venta sabiendo que no afecta ventas pasadas.
    - Entonces el cambio queda auditado y las ventas registradas conservan su precio.
  - **US-010.4** Como Admin, quiero desactivar un producto con historial en lugar de eliminarlo.
    - Entonces no aparece en nuevas ventas, pero sí en reportes; eliminar solo es posible si nunca tuvo movimientos.
  - **US-010.5** Como Operador, quiero buscar productos por nombre o código desde el teléfono.
  - **US-010.6** Como Admin, quiero definir un stock mínimo por producto para ver alertas (reemplaza el umbral fijo de 3).
- **Entidades:** `products`, `product_categories`, `units`, (`product_price_history` MP).
- **Riesgos:** D-02; unidades mal elegidas al importar → el importador asigna "Unidad" por defecto y permite corregir antes de operar.
- **Pruebas:** pgTAP: no borrar con movimientos; decimales según unidad; RLS. Unitarias de validación Zod.
- **Completada cuando:** catálogo completo operativo con alta, edición, desactivación y saldo inicial.

## EPIC-011 · Movimientos de inventario no comerciales y ajustes
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-008, EPIC-010

- **Objetivo de negocio:** que cada cambio de existencias tenga causa, autor y no se pueda alterar en silencio.
- **Problema:** H-01, H-02, H-04; la forma de pago "ninguno" es la única salida sin venta.
- **Incluye:** libro `inventory_movements` solo de inserción; `stock_balances`; RPC `inv_post_movement` para apertura, ajuste positivo/negativo (con motivo), consumo interno, merma, donación (lista de motivos configurable, P-03); anulación por contramovimiento con motivo; validación de stock final y en fechas posteriores (D-08); límite de días hacia atrás; idempotencia.
- **Excluye:** ventas y compras (EPIC-014/017 reutilizan este libro); transferencias.
- **Historias:**
  - **US-011.1** Como Admin, quiero registrar un ajuste de inventario con motivo tras un conteo físico.
    - Dado saldo sistema 10 y físico 8, cuando registro el ajuste a 8, entonces se crea una salida de 2 con motivo "Ajuste por conteo" y el saldo queda 8.
  - **US-011.2** Como Operador, quiero registrar una salida por consumo interno o merma con motivo, sin que cuente como venta.
  - **US-011.3** Como Admin, quiero anular un movimiento erróneo y que quede el original y su reverso en el kardex.
    - Entonces el movimiento original queda marcado "anulado", aparece el contramovimiento con motivo y autor, y el saldo se recalcula.
  - **US-011.4** Como Operador, quiero que el sistema impida dejar existencias negativas, incluso al registrar con fecha pasada.
    - Dado saldo 5 el día 10 y una venta de 5 el día 12, cuando intento una salida de 3 con fecha día 11, entonces se rechaza indicando la fecha en que el saldo quedaría negativo.
  - **US-011.5** Como Operador, si toco dos veces "Registrar" por mala señal, quiero que se registre una sola vez.
- **Entidades:** `inventory_movements`, `stock_balances`, `movement_reasons`.
- **Áreas:** RPC, `modules/inventory/movements`.
- **Riesgos:** rendimiento de verificación en fechas posteriores → índice `(inventory_id, product_id, movement_date)`; límite de días.
- **Pruebas:** pgTAP: stock nunca negativo (incl. concurrencia), reversos, inmutabilidad (UPDATE/DELETE rechazados), idempotencia; e2e de ajuste.
- **Completada cuando:** no existe ninguna ruta (UI ni API) que borre o modifique un movimiento.

## EPIC-012 · Kardex y existencias valoradas
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-011

- **Objetivo de negocio:** saber cuánto hay y cuánto vale, y explicar cada cambio.
- **Problema:** H-07 (valoración a precio de venta).
- **Incluye:** kardex por producto (fecha, tipo/motivo, documento de origen con enlace, entrada, salida, saldo, autor; filtros de fecha); existencias **por inventario y globales** (suma de todos los inventarios, con desglose) con filtros (categoría, bajo mínimo) y **dos valoraciones**: a precio de venta vigente y a último costo (D-06); verificación nocturna `stock_balances` = Σ kardex.
- **Excluye:** costo promedio ponderado y kardex valorado (mejora prioritaria, misma épica en fase 2 si D-06 lo decide).
- **Historias:**
  - **US-012.0** Como Propietario, quiero consultar el stock de un producto en total y desglosado por inventario.
  - **US-012.1** Como Admin, quiero ver el kardex de un producto con saldo acumulado y enlace a la venta o compra que originó cada línea.
  - **US-012.2** Como Propietario, quiero ver existencias valoradas a costo y a precio de venta, y su diferencia (margen potencial).
  - **US-012.3** Como Operador, quiero ver qué productos están bajo su stock mínimo.
  - **US-012.4** Como Admin, quiero consultar el kardex entre dos fechas con saldo inicial del período.
- **Entidades:** vistas `v_kardex`, `v_stock_valuation`. **Áreas:** consultas SQL, `modules/inventory/kardex`.
- **Riesgos:** productos sin costo conocido (saldos iniciales importados) → mostrar "sin costo" y excluir de la valoración a costo con aviso.
- **Pruebas:** pgTAP de vistas con casos conocidos; unitarias de saldo inicial del período.
- **Completada cuando:** las cifras del kardex y las existencias coinciden con un caso de prueba calculado a mano.

---

# B4 · Ventas y cuentas por cobrar

## EPIC-013 · Terceros: clientes
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** EPIC-007

- **Objetivo de negocio:** saldos por cliente correctos y sin duplicados.
- **Problema:** H-08 (clientes en texto libre).
- **Incluye:** tabla `parties` (D-05) con nombre, nombre normalizado, documento (CI/NIT) opcional, teléfono, notas, indicadores cliente/proveedor/productor; alta rápida desde el formulario de venta; búsqueda tolerante a mayúsculas y tildes; aviso de posible duplicado; fusión de duplicados (Admin).
- **Excluye:** límites de crédito, listas de precios.
- **Historias:**
  - **US-013.1** Como Operador, quiero buscar un cliente escribiendo parte del nombre, sin importar tildes ni mayúsculas.
  - **US-013.2** Como Operador, quiero crear un cliente nuevo sin salir de la venta.
    - Entonces, si existe uno con nombre normalizado igual, el sistema lo sugiere antes de crear otro.
  - **US-013.3** Como Admin, quiero fusionar dos clientes duplicados y que sus ventas y cobros queden bajo uno.
    - Entonces la fusión queda auditada y los saldos se suman.
- **Entidades:** `parties`. **Riesgos:** D-05.
- **Pruebas:** unitarias de normalización; pgTAP de fusión.
- **Completada cuando:** no es posible crear dos clientes con el mismo nombre normalizado sin confirmación explícita.

## EPIC-014 · Registro de ventas
**Prioridad:** P0 · **Esfuerzo:** L · **Depende de:** EPIC-011, EPIC-013

- **Objetivo de negocio:** vender rápido desde el teléfono con stock y saldos siempre consistentes.
- **Problema:** venta = movimiento de un producto (sin documento), edición libre del historial.
- **Incluye:** venta con número, fecha, inventario, cliente, modalidad, destino, notas y **varias líneas** (producto, cantidad, precio propuesto editable, subtotal); modalidades configurables `sale_modalities` (contado, crédito, intercambio, reproas) con reglas *requiere cliente / genera cuenta por cobrar / cuenta como ingreso*; cobro inicial opcional en el mismo paso; RPC `sales_post_sale` atómica; detalle de venta con impresión de comprobante simple; listado con filtros.
- **Excluye:** facturación fiscal, descuentos globales e impuestos (P2), edición de ventas registradas (se anulan: EPIC-016), contrapartida de intercambio (P-02, ver riesgos).
- **Historias:**
  - **US-014.1** Como Operador, quiero registrar una venta al contado de uno o más productos en pocos toques.
    - Dado stock suficiente, cuando confirmo, entonces se crea la venta N° correlativo, baja el stock de cada producto y queda cobrada por el total con fecha de hoy.
  - **US-014.2** Como Operador, quiero registrar una venta a crédito, obligando a elegir cliente.
    - Entonces la venta queda "Pendiente" con saldo = total y aparece en CxC.
  - **US-014.3** Como Operador, quiero registrar un pago parcial al momento de la venta.
    - Entonces se crea un cobro por ese monto y el saldo queda en total − cobro; el cobro no puede superar el total.
  - **US-014.4** Como Operador, quiero registrar una venta por intercambio o reproas, que se reporte aparte.
    - Entonces la modalidad queda registrada y los reportes la totalizan por separado, igual que hoy.
  - **US-014.5** Como Operador, quiero que el precio propuesto sea el vigente, pero poder ajustarlo en la línea.
  - **US-014.6** Como Operador, quiero que si no hay stock suficiente el sistema me diga cuánto queda y no registre nada.
  - **US-014.7** Como Admin, quiero consultar ventas por fecha, cliente, modalidad, estado o producto.
- **Entidades:** `sales`, `sale_items`, `sale_modalities`, `inventory_movements`, `customer_payments`, `payment_allocations`.
- **Áreas:** RPC, `modules/sales`, formularios multi-línea en móvil.
- **Riesgos/decisiones:** P-01 (reproas), P-02 (qué se recibe en un intercambio; si entra a inventario se agregará "ingreso por intercambio" en una iteración posterior), P-04 (contado pendiente), P-09 (destino = predio).
- **Pruebas:** pgTAP de `sales_post_sale` (stock, totales, cobro inicial, idempotencia, concurrencia último ítem); e2e contado y crédito en móvil.
- **Completada cuando:** las 4 modalidades se registran correctamente y una venta de 1 producto al contado toma ≤ 30 s en un teléfono (CE-5).

## EPIC-015 · Cobros y cuentas por cobrar
**Prioridad:** P0 · **Esfuerzo:** L · **Depende de:** EPIC-014

- **Objetivo de negocio:** saber exactamente quién debe, cuánto y desde cuándo, y registrar cada abono.
- **Problema:** H-05 (sin historial de pagos), H-06 (pendiente mal calculado), H-11 (no se puede cobrar desde CxC).
- **Incluye:** registro de cobro (fecha, monto, medio: efectivo/transferencia/QR, referencia) aplicado a una o varias ventas del cliente (aplicación automática a la más antigua o manual); vista `v_receivables`; pantalla CxC con resumen por cliente y detalle; **estado de cuenta** del cliente (ventas, cobros, saldo acumulado, incluidas las canceladas); antigüedad simple (0–30, 31–60, 61–90, > 90 días desde la venta).
- **Excluye:** vencimientos por condición de pago, intereses, recordatorios automáticos (P2).
- **Historias:**
  - **US-015.1** Como Operador, quiero registrar un cobro desde la ficha del cliente o desde CxC.
    - Dado un cliente con dos ventas pendientes (300 y 500), cuando cobro 400 en automático, entonces la primera queda cancelada y la segunda con saldo 400.
  - **US-015.2** Como Admin, quiero ver CxC agrupada por cliente con total, cobrado y saldo, y filtrar por cliente.
  - **US-015.3** Como Propietario, quiero ver el estado de cuenta histórico de un cliente, incluidas las operaciones ya canceladas.
  - **US-015.4** Como Admin, quiero ver la antigüedad de los saldos para priorizar cobranzas.
  - **US-015.5** Como Operador, quiero que no se pueda cobrar más que el saldo pendiente (el excedente se rechaza en el MVP).
- **Entidades:** `customer_payments`, `payment_allocations`, `v_receivables`.
- **Riesgos:** pagos excedentes / anticipos (saldo a favor) → fuera del MVP; documentar como P2.
- **Pruebas:** pgTAP de asignaciones y límites; cifras de CxC vs. casos manuales; e2e de cobro parcial.
- **Completada cuando:** el saldo de CxC de un cliente es igual a Σ ventas vigentes − Σ cobros vigentes en todos los casos de prueba.

## EPIC-016 · Anulación de ventas y cobros
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-015

- **Objetivo de negocio:** corregir errores sin perder trazabilidad.
- **Problema:** H-01 (anular = borrar), edición libre.
- **Incluye:** anular venta con motivo (reverso de stock + anulación de cobros asignados, D-12); anular cobro con motivo (saldo de la venta vuelve a abrirse); "anular y copiar" para volver a registrar corrigiendo; reglas de quién puede anular (D-09); visualización de anuladas (tachadas) y filtro.
- **Excluye:** notas de crédito parciales / devoluciones parciales de mercadería (P2).
- **Historias:**
  - **US-016.1** Como Admin, quiero anular una venta indicando el motivo, para que el stock vuelva y la venta deje de contar en reportes.
    - Entonces la venta queda "Anulada" con motivo, autor y fecha; el kardex muestra el reverso; los cobros asociados quedan anulados.
  - **US-016.2** Como Operador, quiero anular un cobro mal registrado.
  - **US-016.3** Como Operador, quiero corregir una venta mal cargada copiándola en una nueva y anulando la original en un solo paso.
  - **US-016.4** Como Operador, solo puedo anular mis propias operaciones del día; las demás requieren Admin (D-09).
- **Entidades:** `sales.status/void_*`, `customer_payments.status`, `inventory_movements` (reversos), `audit_log`.
- **Pruebas:** pgTAP: anulación idempotente, no anular dos veces, permisos por rol/fecha; e2e anulación.
- **Completada cuando:** reportes, CxC y kardex reflejan correctamente las anulaciones en los casos de prueba.

---

# B5 · Compras y cuentas por pagar

## EPIC-017 · Proveedores y compras
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-011, EPIC-013

- **Objetivo de negocio:** registrar lo que entra con su costo real y a quién se le debe.
- **Problema:** proveedor en texto libre; costo solo por movimiento; precio de venta confundido con costo en valoración.
- **Incluye:** proveedores en `parties` (indicador proveedor); compra con número, fecha, proveedor, inventario, referencia del documento del proveedor (factura/nota), varias líneas con cantidad y **costo unitario**; pago inicial opcional; RPC `purch_post_purchase` (entradas al kardex con costo, actualización de último costo); anulación de compra con motivo validando que el stock no quede negativo.
- **Excluye:** órdenes de compra, recepciones parciales, impuestos, costos de flete prorrateados (P2).
- **Historias:**
  - **US-017.1** Como Operador, quiero registrar una compra con varias líneas y su costo, para que aumente el stock y quede la deuda con el proveedor.
  - **US-017.2** Como Operador, quiero registrar una compra pagada al contado en el mismo paso.
  - **US-017.3** Como Admin, quiero anular una compra errónea; si ya se vendió parte, el sistema me lo impide e indica el saldo resultante.
  - **US-017.4** Como Admin, quiero ver el historial de compras por proveedor y por producto (con costo unitario).
- **Entidades:** `parties`, `purchases`, `purchase_items`, `inventory_movements`, `stock_balances.last_cost`.
- **Riesgos:** compras sin costo en el histórico importado → marcar "costo desconocido".
- **Pruebas:** pgTAP de RPC y anulación con stock comprometido; e2e compra a crédito.
- **Completada cuando:** una compra actualiza stock, último costo y CxP de forma atómica en todos los casos de prueba.

## EPIC-018 · Pagos y cuentas por pagar
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-017

- **Objetivo de negocio:** saber cuánto se debe a cada proveedor y registrar cada pago.
- **Incluye:** pago a proveedor aplicado a una o varias compras; vista `v_payables`; CxP por proveedor y detalle; estado de cuenta del proveedor; anulación de pagos con motivo; antigüedad simple.
- **Excluye:** programación de pagos, conciliación bancaria.
- **Historias:**
  - **US-018.1** Como Admin, quiero registrar un pago parcial a un proveedor y ver el saldo actualizado.
  - **US-018.2** Como Propietario, quiero ver la CxP total y por proveedor con antigüedad.
  - **US-018.3** Como Admin, quiero el estado de cuenta histórico de un proveedor.
  - **US-018.4** Como Admin, quiero anular un pago mal registrado con motivo.
- **Entidades:** `supplier_payments`, `supplier_payment_allocations`, `v_payables`.
- **Pruebas:** pgTAP (simétricas a EPIC-015); cifras vs. casos manuales.
- **Completada cuando:** saldo por proveedor = Σ compras vigentes − Σ pagos vigentes en todos los casos de prueba.

## EPIC-019 · Obligaciones no ligadas a compras
**Prioridad:** P1 · **Esfuerzo:** M · **Depende de:** EPIC-018 · **Pendiente de definición:** P-05

- **Objetivo de negocio:** registrar deudas que no son compras de mercadería (servicios, alquileres, préstamos, fletes) sin convertir el sistema en contabilidad.
- **Problema:** el prototipo no lo permite; el propietario debe confirmar si lo necesita.
- **Incluye (propuesto):** obligación con acreedor (`parties`), concepto/categoría, monto, fecha, vencimiento opcional; pagos con el mismo mecanismo que EPIC-018; aparece en CxP con tipo "Otra obligación".
- **Excluye:** plan de cuentas, intereses, cuotas automáticas.
- **Historias:**
  - **US-019.1** Como Admin, quiero registrar una deuda por un servicio y pagarla en partes.
  - **US-019.2** Como Propietario, quiero ver CxP separando compras de otras obligaciones.
- **Entidades:** `payables` (o `purchases` con `kind = 'expense'`, a decidir en el diseño).
- **Riesgos:** solaparse con cargo a rendir (gastos) → regla: un gasto pagado por un responsable con fondos entregados va en el cargo; una deuda con un tercero va aquí.
- **Pruebas:** como EPIC-018.
- **Completada cuando:** P-05 respondida y obligaciones visibles en CxP con pagos parciales.

---

# B6 · Reportes y documentos

## EPIC-020 · Motor de reportes, impresión y PDF
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-003

- **Objetivo de negocio:** documentos presentables y consistentes para revisar, firmar y enviar.
- **Problema:** H-20 (cada reporte implementado tres veces).
- **Incluye:** `ReportDefinition` (datos + secciones + columnas + totales); renderizadores HTML (pantalla + impresión A4), PDF en servidor (D-10) y CSV; cabecera estándar (negocio, inventario, título, período, emisión, usuario emisor), pie con página "x de y", líneas de firma "Elaborado por / Revisado por", marca de agua del logo opcional; compartir PDF por Web Share API con descarga como alternativa; selector de período (día, mes, rango).
- **Excluye:** diseñador de reportes por el usuario, programación de envíos.
- **Historias:**
  - **US-020.1** Como Admin, quiero imprimir cualquier reporte en A4 sin la navegación de la app.
  - **US-020.2** Como Operador, quiero enviar el PDF del reporte por WhatsApp desde el teléfono.
    - Entonces en móviles compatibles se abre el menú de compartir con el archivo; si no, se descarga.
  - **US-020.3** Como Admin, quiero exportar las tablas de un reporte a CSV para abrirlas en Excel.
  - **US-020.4** Como Propietario, quiero que los reportes digan quién los emitió y cuándo.
- **Áreas:** `modules/reports/engine`, `app/api/pdf`.
- **Riesgos:** límites de tiempo de funciones serverless en reportes grandes → paginar consultas, limitar rango (p. ej., 12 meses) y medir.
- **Pruebas:** unitarias del motor (totales, saltos de página); prueba visual de un PDF de referencia.
- **Completada cuando:** un reporte de ejemplo se ve igual en pantalla, impresión, PDF y CSV a partir de una sola definición.

## EPIC-021 · Reportes operativos del MVP
**Prioridad:** P0 · **Esfuerzo:** L · **Depende de:** EPIC-012, EPIC-016, EPIC-018, EPIC-020

- **Objetivo de negocio:** cerrar el día y el mes con cifras confiables.
- **Problema:** H-06 y falta de reportes por fecha de cobro.
- **Incluye** (paridad con el prototipo + correcciones):
  1. **Reporte diario de ventas**: resumen por modalidad, pendiente de cobro (**saldo real**), transacciones, unidades vendidas e ingresadas, productos vendidos (cantidad, precio promedio, importe, más/menos vendido), detalle de ventas, detalle de ingresos; filtro de productos.
  2. **Reporte mensual de ventas**: lo anterior + venta por día.
  3. **Cierre de cobros** (nuevo): cobros recibidos en el período por medio de pago, separando cobros de ventas del período y de ventas anteriores.
  4. **Inventario general**: existencias valoradas (precio y costo), ingresos y egresos del período.
  5. **Kardex de producto**.
  6. **Cuentas por cobrar** y **por pagar**: general y por tercero, con antigüedad.
  7. **Salidas no comerciales** por motivo (nuevo, reemplaza la forma de pago "-").
- **Excluye:** margen por producto con costo promedio (cuando D-06 lo habilite), consolidado multi-inventario (P1, EPIC-022).
- **Historias:**
  - **US-021.1** Como Admin, quiero el reporte diario de ventas con las mismas secciones que hoy.
    - Dado un conjunto de ventas de prueba, entonces cada cifra coincide con el cálculo esperado; "Pendiente de cobro" usa saldos (cambio documentado respecto al prototipo).
  - **US-021.2** Como Admin, quiero el reporte mensual con venta por día.
  - **US-021.3** Como Propietario, quiero saber cuánto dinero entró hoy por cada medio de pago (cierre de cobros).
  - **US-021.4** Como Admin, quiero excluir productos del reporte, como hoy.
  - **US-021.5** Como Admin, quiero el inventario general y el kardex en PDF.
  - **US-021.6** Como Admin, quiero los reportes de CxC y CxP en PDF, generales y por tercero.
- **Entidades:** vistas/funciones de reporte (`rpt_sales_summary`, `rpt_collections`, etc.).
- **Riesgos:** diferencias con cifras históricas del prototipo por la corrección de H-06/H-07 → explicarlas en la conciliación de B7.
- **Pruebas:** pgTAP/Vitest con datos semilla de cifras conocidas para cada reporte; e2e de generación de PDF.
- **Completada cuando:** todos los reportes del prototipo del módulo Inventario tienen equivalente validado por el propietario.

## EPIC-022 · Tablero de inicio e indicadores
**Prioridad:** P1 · **Esfuerzo:** M · **Depende de:** EPIC-021

- **Objetivo de negocio:** ver de un vistazo cómo va el negocio.
- **Incluye:** tarjetas de ventas de hoy y del mes (vs. mes anterior), cobros de hoy, CxC y CxP totales, productos bajo mínimo, últimas operaciones; accesos rápidos "Nueva venta", "Registrar cobro"; consolidado de todos los inventarios.
- **Excluye:** BI avanzado, gráficos personalizables.
- **Historias:**
  - **US-022.1** Como Propietario, al abrir la app quiero ver ventas, cobros y saldos del día.
  - **US-022.2** Como Operador, quiero accesos directos a las acciones que más uso.
  - **US-022.3** Como Propietario, quiero un resumen consolidado de todos los inventarios.
- **Riesgos:** consultas pesadas → vistas materializadas o agregados si se mide lentitud.
- **Pruebas:** cifras del tablero = cifras de los reportes para el mismo período.
- **Completada cuando:** el tablero carga en < 2 s con el volumen real importado.

---

# B7 · Salida a producción (migración + PWA)

## EPIC-023 · Importador del respaldo del prototipo
**Prioridad:** P0 · **Esfuerzo:** L · **Depende de:** EPIC-012, EPIC-016, EPIC-018

- **Objetivo de negocio:** no perder la historia actual ni volver a cargar datos a mano.
- **Problema:** datos en JSON con formatos legados, textos libres y sin ids estables (ver `01` §2).
- **Incluye:** script/CLI `scripts/import-prototype` (ejecutado por una persona autorizada, nunca desde el navegador público) en fases: **leer → validar → transformar → previsualizar → importar → conciliar**; soporte de respaldos con y sin envoltorio y formatos legados (R-13, `metas`, `ko/kr`, "Adulto"); informe de duplicados de clientes/proveedores con propuesta de fusión; transformación de movimientos en documentos (cada salida → venta de una línea; cada ingreso con costo → compra; ingreso sin costo → apertura; `paid` → un cobro/pago con fecha `fpago`; `ninguno` → salida no comercial con motivo "Migrado sin forma de pago"); importación idempotente marcada con `import_batch_id`; conservación del archivo original con su hash.
- **Excluye:** módulos post-MVP (cada uno importa sus datos en su épica reutilizando este marco).
- **Historias:**
  - **US-023.1** Como Admin, quiero cargar el respaldo y ver un resumen previo (inventarios, productos, movimientos, clientes, proveedores, saldos) antes de importar.
  - **US-023.2** Como Admin, quiero revisar y unificar clientes/proveedores con nombres casi iguales antes de importar.
  - **US-023.3** Como Propietario, quiero un informe de conciliación que compare, por producto, existencia del prototipo vs. nueva app, y por tercero, saldos de CxC/CxP.
    - Entonces todas las diferencias son 0 o están explicadas (p. ej., stock negativo heredado por H-02, que se importa con un ajuste explícito de "Regularización de migración").
  - **US-023.4** Como Admin, quiero poder repetir la importación en staging cuantas veces sea necesario y deshacer un lote de prueba.
  - **US-023.5** Como Propietario, quiero que el archivo original quede guardado sin cambios.
- **Entidades:** todas las de B3–B5 + `import_batches`.
- **Riesgos:** sin respaldo real hasta tarde (ver `06`, R-01); productos con mismo nombre en distinto inventario; movimientos con producto inexistente (borrados) → informe de huérfanos.
- **Pruebas:** respaldos sintéticos que cubren cada formato legado y cada defecto conocido (H-02, H-04, H-08); conciliación automática = 0; prueba de idempotencia.
- **Completada cuando:** el respaldo real se importa en staging con conciliación aprobada por el propietario.

## EPIC-024 · PWA instalable y experiencia móvil
**Prioridad:** P0 · **Esfuerzo:** S · **Depende de:** EPIC-003

- **Objetivo de negocio:** que el equipo abra la app como una aplicación más del teléfono.
- **Incluye:** manifiesto completo, iconos (incl. *maskable* y Apple), pantalla de inicio; service worker con precaché de recursos estáticos y página "Sin conexión"; aviso de nueva versión con botón "Actualizar"; indicador de conexión y bloqueo de envíos sin conexión conservando el formulario; guía de instalación para Android e iOS.
- **Excluye:** registro de datos sin conexión (EPIC-033), notificaciones push.
- **Historias:**
  - **US-024.1** Como Operador, quiero instalar la app en mi Android desde el aviso del navegador.
  - **US-024.2** Como Operador con iPhone, quiero instrucciones claras para "Añadir a pantalla de inicio".
  - **US-024.3** Como usuario, quiero saber cuando no tengo conexión y que no se pierda lo que estaba escribiendo.
  - **US-024.4** Como usuario, quiero que me avise cuando hay una versión nueva y actualizar con un toque.
- **Riesgos:** caché de versiones viejas tras un despliegue → estrategia de actualización probada; compatibilidad hacia atrás de la API durante el cambio.
- **Pruebas:** Lighthouse PWA (instalable); prueba manual en Android/iOS; e2e con red desconectada.
- **Completada cuando:** CE-7 verificado en al menos un Android y un iPhone del equipo.

## EPIC-025 · Puesta en producción y convivencia
**Prioridad:** P0 · **Esfuerzo:** M · **Depende de:** EPIC-021, EPIC-023, EPIC-024

- **Objetivo de negocio:** pasar a operar en la nueva app con riesgo controlado.
- **Incluye:** checklist de salida (RLS revisado, secretos, SMTP, dominio, respaldos automáticos activos, exportación lógica programada, simulacro de restauración en staging); carga de usuarios reales; importación en producción; **período de convivencia** (fecha de corte: a partir de ella inventario y ventas solo en la nueva app; el prototipo queda de solo consulta para esos módulos); capacitación breve y guía de uso; canal de soporte y registro de incidencias.
- **Historias:**
  - **US-025.1** Como Propietario, quiero una fecha de corte clara y que los saldos al corte coincidan con el prototipo.
  - **US-025.2** Como Operador, quiero una guía corta con los flujos de venta, cobro y compra.
  - **US-025.3** Como Propietario, quiero saber que, si algo falla, los datos se pueden recuperar (simulacro documentado).
- **Riesgos:** registros duplicados en ambos sistemas durante la convivencia → corte por módulo y fecha, comunicado por escrito.
- **Pruebas:** simulacro de restauración; humo en producción tras la importación.
- **Completada cuando:** H2 alcanzado y una semana de operación real sin incidencias bloqueantes.

---

# B8 · Cargo a rendir

## EPIC-026 · Fondos a rendir y registro de gastos
**Prioridad:** P1 · **Esfuerzo:** M · **Depende de:** EPIC-008

- **Objetivo de negocio:** saber cuánto dinero tiene cada responsable y en qué lo gastó.
- **Problema:** un único cargo abierto, sin responsable ni comprobantes; registros borrables (ver `01` §3.6).
- **Incluye:** cargo con número, **responsable** (usuario o tercero, P-10), propósito, fecha de apertura; varios cargos abiertos a la vez; registros de **entrega** (fondos entregados), **gasto** (fecha, detalle, categoría, monto, N° de comprobante, foto opcional en Storage), **devolución** (el responsable devuelve sobrante) y **reembolso** (la empresa repone un exceso de gasto); saldo a rendir en vivo; anulación de registros con motivo mientras el cargo está abierto; rol `fund_holder` que solo ve sus cargos; importación de `cargo`/`cargoH` del prototipo.
- **Excluye:** aprobación de gastos en varios niveles, integración contable.
- **Historias:**
  - **US-026.1** Como Admin, quiero abrir un cargo a nombre de un responsable y registrar la entrega de fondos.
  - **US-026.2** Como Responsable, quiero registrar mis gastos desde el teléfono con foto del comprobante.
    - Entonces el gasto queda con monto, categoría, comprobante y foto; el saldo a rendir baja.
  - **US-026.3** Como Responsable, quiero ver solo mis cargos y su saldo.
  - **US-026.4** Como Admin, quiero ver todos los cargos abiertos con su saldo por responsable.
  - **US-026.5** Como Admin, quiero importar los cargos del prototipo con su historial (responsable "Sin asignar" a completar).
- **Entidades:** `cash_advances`, `cash_advance_entries`, `expense_categories`; Storage `receipts` (bucket privado, RLS por organización y responsable).
- **Riesgos:** P-10 (¿el responsable es siempre un usuario?), tamaño de fotos → compresión en el cliente y límite de tamaño.
- **Pruebas:** pgTAP de saldo y permisos `fund_holder`; políticas de Storage; e2e de gasto con foto.
- **Completada cuando:** un responsable registra gastos con comprobante y el admin ve saldos correctos de varios cargos simultáneos.

## EPIC-027 · Rendición, cierre conciliado y reportes
**Prioridad:** P1 · **Esfuerzo:** M · **Depende de:** EPIC-026, EPIC-020

- **Objetivo de negocio:** cerrar cada cargo con las cuentas claras.
- **Problema:** cierre sin conciliación y cargos cerrados editables (H-09).
- **Incluye:** rendición: revisión de gastos por el admin (aprobado/observado, P2 si se requiere); **cierre** solo si saldo = 0, o registrando en el mismo paso la devolución o el reembolso que lo deja en cero; cargo cerrado **inmutable**; reapertura solo por Admin con motivo auditado; opción de arrastrar saldo a un nuevo cargo del mismo responsable (P-10); reportes: cargo individual, todos los cargos (resumen + detalle), gastos por categoría y período.
- **Historias:**
  - **US-027.1** Como Admin, quiero cerrar un cargo y que el sistema me exija dejar el saldo en cero con una devolución o reembolso.
  - **US-027.2** Como Admin, quiero que un cargo cerrado no pueda modificarse, salvo reapertura justificada.
  - **US-027.3** Como Propietario, quiero el reporte de todos los cargos y de gastos por categoría.
  - **US-027.4** Como Admin, quiero imprimir el cargo con líneas de firma para el responsable.
- **Pruebas:** pgTAP: cierre con saldo ≠ 0 rechazado; inmutabilidad; reapertura auditada.
- **Completada cuando:** H3: todos los cargos importados están abiertos o cerrados en cero, y los reportes cuadran.

---

# B9 · Operaciones ganaderas

## EPIC-028 · Predios y productores
**Prioridad:** P1 · **Esfuerzo:** S · **Depende de:** EPIC-013

- **Objetivo de negocio:** una lista única de predios y productores usada por todos los módulos.
- **Problema:** predios y productores en texto libre repetidos en envíos, contador y destino de ventas.
- **Incluye:** `properties` (nombre, ubicación/referencia, responsable/propietario opcional, activo); productores como `parties` con indicador productor; normalización y fusión; importación de nombres desde envíos y contador del prototipo con revisión de duplicados.
- **Excluye:** georreferenciación, superficies, potreros (P3).
- **Historias:**
  - **US-028.1** Como Admin, quiero mantener la lista de predios.
  - **US-028.2** Como Admin, quiero mantener la lista de productores y saber si un productor también es cliente o proveedor.
  - **US-028.3** Como Admin, quiero unificar predios escritos de forma distinta al importar.
- **Riesgos:** P-09 (destino de venta = predio), P-12 (relación predio–productor).
- **Pruebas:** pgTAP unicidad/RLS; unitarias de normalización.
- **Completada cuando:** envíos y conteos importados referencian predios y productores únicos.

## EPIC-029 · Hojas de envío a predios
**Prioridad:** P1 · **Esfuerzo:** M · **Depende de:** EPIC-028, EPIC-020

- **Objetivo de negocio:** controlar qué se envía a cada predio y cuánto vale, por hoja, predio y mes.
- **Problema:** ver `01` §3.7; desconexión con el inventario (H-14).
- **Incluye:** hoja de envío con número y estado (abierta/cerrada inmutable con reapertura auditada); líneas con fecha, predio, detalle o **producto del inventario opcional**, cantidad decimal, unidad, precio unitario, total; reportes: hoja, por predio (todas las hojas), mensual con resumen por predio; rol `field` puede registrar en hojas abiertas; importación de `env`/`envH`.
- **Decisión P-06:** si se confirma que lo enviado sale del inventario, las líneas con producto generarán una salida de inventario con motivo "Envío a predio" (mismo RPC de EPIC-011). Si no, el envío queda solo como registro valorado.
- **Historias:**
  - **US-029.1** Como Campo/Operador, quiero registrar un envío a un predio desde el teléfono.
  - **US-029.2** Como Admin, quiero cerrar la hoja y que ya no se pueda modificar.
  - **US-029.3** Como Propietario, quiero el reporte por predio y el mensual con resumen por predio.
  - **US-029.4** (condicional a P-06) Como Admin, quiero que al enviar un producto del inventario se descuente su stock.
- **Pruebas:** pgTAP de inmutabilidad y, si aplica, de descuento de stock; cifras de reportes.
- **Completada cuando:** reportes por predio y mes coinciden con los del prototipo para los datos importados.

## EPIC-030 · Conteos de ganado
**Prioridad:** P1 · **Esfuerzo:** M · **Depende de:** EPIC-028, EPIC-020

- **Objetivo de negocio:** registrar conteos en campo y conocer la situación de cada predio sin errores de doble suma.
- **Problema:** H-10, H-18; diferencia entre conteo e inventario.
- **Incluye:** **conteo** (sesión) con nombre, fecha, predio(s), estado borrador/cerrado; filas por predio, productor, categoría, edad y cantidad; botones +/− grandes; catálogos de categorías y edades (semilla del prototipo, editables); reportes del conteo (detalle, por productor, por categoría y edad); vista **"Último conteo por predio"** (no suma conteos distintos); comparación entre dos conteos del mismo predio (diferencias por categoría); importación de `cnts`.
- **Excluye:** inventario vivo de animales (EPIC-035), identificación individual, sanidad.
- **Historias:**
  - **US-030.1** Como Campo, quiero crear un conteo y agregar filas rápidamente, con el productor y la fecha precargados de la fila anterior.
  - **US-030.2** Como Campo, quiero sumar o restar cabezas con botones grandes mientras cuento.
  - **US-030.3** Como Campo, quiero cerrar el conteo cuando termino, para que quede como registro histórico.
  - **US-030.4** Como Propietario, quiero ver las cabezas por predio según el último conteo cerrado, por categoría y productor.
    - Entonces nunca se suman dos conteos del mismo predio.
  - **US-030.5** Como Propietario, quiero comparar dos conteos de un predio.
- **Riesgos:** P-07 (significado de C-24…C-27), P-08 (¿se necesita inventario vivo?), conectividad en campo (EPIC-033).
- **Pruebas:** pgTAP de la vista "último conteo"; e2e móvil del flujo de conteo.
- **Completada cuando:** H4 y propietario valida los totales del último conteo de cada predio.

---

# B10 · Metas y productividad

## EPIC-031 · Metas y tareas
**Prioridad:** P2 · **Esfuerzo:** S · **Depende de:** EPIC-008, EPIC-020

- **Recomendación:** módulo **complementario**, fuera del núcleo; no comparte datos con los módulos financieros.
- **Objetivo de negocio:** seguir el cumplimiento de tareas diarias por período.
- **Incluye:** barras de metas con nombre y período; tareas con fecha (dentro del período, H-19), detalle, **responsable** opcional, estado, fecha y autor de ejecución; % por día, por período y por responsable; PDF del día y del período; importación de `bars`/`metas`.
- **Excluye:** recurrencia automática, recordatorios (P3), vínculo con indicadores de otros módulos (P3).
- **Historias:**
  - **US-031.1** Como Admin, quiero crear una barra de metas con período y cargar tareas por día.
  - **US-031.2** Como Campo, quiero marcar mis tareas como ejecutadas desde el teléfono.
  - **US-031.3** Como Propietario, quiero ver el % de cumplimiento por día, período y responsable.
- **Pruebas:** pgTAP de validación de período; unitarias de porcentajes.
- **Completada cuando:** H5: paridad con el prototipo y datos importados.

---

# B11 · Consolidación y crecimiento

## EPIC-032 · Observabilidad, seguridad, rendimiento y recuperación
**Prioridad:** P1 · **Esfuerzo:** M (continuo) · **Depende de:** EPIC-025

- **Incluye:** monitoreo de errores del frontend y servidor (p. ej., Sentry), alertas básicas; pantalla de auditoría para Admin con filtros; revisión periódica de políticas RLS y *advisors* de Supabase; índices según consultas lentas; pruebas de carga ligeras de reportes; respaldo lógico programado fuera de Supabase y simulacro trimestral; rotación de claves; 2FA para propietarios (P2).
- **Historias:**
  - **US-032.1** Como responsable técnico, quiero enterarme de un error en producción antes de que lo reporte un usuario.
  - **US-032.2** Como Propietario, quiero consultar la bitácora de cambios y anulaciones.
  - **US-032.3** Como Propietario, quiero un simulacro documentado de recuperación cada trimestre.
- **Completada cuando:** alertas activas, pantalla de auditoría disponible y primer simulacro trimestral realizado.

## EPIC-033 · Modo sin conexión selectivo para campo
**Prioridad:** P3 · **Esfuerzo:** L · **Depende de:** EPIC-030

- **Condición para iniciarla:** evidencia de uso real de que la falta de señal en predios impide registrar conteos o envíos.
- **Incluye:** caché local de catálogos necesarios (predios, productores, categorías); cola en IndexedDB de **inserciones** de filas de conteo y envíos con `client_request_id`; sincronización al reconectar; indicador de pendientes; resolución de conflictos simple (los registros no se editan offline; si un conteo fue cerrado por otro usuario, las filas pendientes se envían a un conteo nuevo y se avisa).
- **Excluye:** ventas, cobros y movimientos de stock sin conexión.
- **Completada cuando:** un conteo completo se registra sin señal y se sincroniza sin duplicados.

## EPIC-034 · Crecimiento: multi-organización, transferencias e integraciones
**Prioridad:** P3 · **Esfuerzo:** XL · **Depende de:** EPIC-025

- **Incluye (candidatos, a priorizar):** UI multi-organización (selector, alta de organización); sucursales/depósitos con **transferencias entre inventarios**; permisos por inventario; API o webhooks para integraciones (contabilidad, facturación electrónica si se requiere); automatizaciones (resumen diario por correo/WhatsApp).
- **Completada cuando:** se define y entrega cada sub-épica por separado.

## EPIC-035 · Inventario vivo de ganado
**Prioridad:** P3 · **Esfuerzo:** XL · **Depende de:** EPIC-030 · **Pendiente de definición:** P-08

- **Incluye (si se confirma):** existencias de animales por predio, categoría y propietario actualizadas por movimientos (nacimiento, muerte, compra, venta, traslado entre predios con documento de traslado, cambio de categoría); conciliación periódica con conteos; despachos con guía de movimiento de ganado.
- **Riesgos:** alto esfuerzo y requisitos regulatorios (documentos de traslado del organismo sanitario) a investigar.
- **Completada cuando:** se define con el propietario y se divide en épicas entregables.
