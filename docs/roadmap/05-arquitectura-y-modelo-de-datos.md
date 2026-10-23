# 05 · Arquitectura y modelo de datos

> Este documento es **preliminar**. Las decisiones marcadas con `D-xx` están descritas en `06-riesgos-y-decisiones.md` con alternativas y recomendación. El esquema definitivo de cada módulo se cierra al inicio de su bloque.

## 1. Vista general

```
┌───────────────────────── Navegador / PWA instalada ─────────────────────────┐
│ Next.js (App Router, React, TypeScript)                                      │
│  · Componentes de UI (shadcn/ui + Tailwind)                                  │
│  · Formularios: React Hook Form + Zod (mismo esquema que el servidor)        │
│  · Service worker: caché de recursos estáticos, aviso de actualización       │
│  · Supabase JS (solo clave pública "anon/publishable" + sesión del usuario)  │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ HTTPS (cookies de sesión)
┌──────────────▼────────────── Servidor Next.js (Vercel) ──────────────────────┐
│  · Server Components: lecturas con el JWT del usuario (RLS aplica)           │
│  · Server Actions / Route Handlers: validan con Zod y llaman RPC             │
│  · Generación de PDF / CSV                                                   │
│  · Middleware: refresco de sesión y protección de rutas                      │
└──────────────┬───────────────────────────────────────────────────────────────┘
               │ PostgREST / RPC
┌──────────────▼──────────────────────── Supabase ─────────────────────────────┐
│  PostgreSQL: tablas, restricciones, RLS, funciones de negocio (RPC),         │
│              triggers de auditoría, vistas de saldos y reportes              │
│  Auth: correo + contraseña (MVP); enlace mágico / OTP evaluable              │
│  Storage: solo desde B8 (comprobantes)                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Regla central:** la lógica que mantiene la integridad (stock, saldos, numeración, anulaciones, cierres) vive en **PostgreSQL**, dentro de funciones transaccionales. El frontend valida para dar buena experiencia, pero la base de datos es la última palabra. Esto cumple el objetivo de reducir la dependencia de la lógica en el navegador y permite añadir en el futuro otros clientes (otra app, integraciones) sin duplicar reglas.

## 2. Frontend

| Tema | Decisión propuesta |
|---|---|
| Framework | Next.js (App Router) + TypeScript estricto. Versión estable vigente al iniciar B1. |
| UI | Tailwind CSS + componentes shadcn/ui (código propio en el repo, accesible, sin dependencia de un paquete cerrado). Tokens de color con modo claro/oscuro, retomando la identidad del prototipo (verde `#157A5B`, naranja, violeta). |
| Formularios | React Hook Form + Zod. Los esquemas Zod se comparten entre cliente y Server Actions. |
| Lectura de datos | Server Components con cliente Supabase de servidor (`@supabase/ssr`). Listas con paginación por cursor/rango. |
| Mutaciones | Server Actions que validan y llaman a funciones RPC. Devuelven un `Result` tipado `{ ok, data } | { ok:false, error:{ code, message, fieldErrors } }`. |
| Estados de UI | Componentes estándar para **cargando**, **vacío**, **error** (con reintento) y **éxito** (toast). Ninguna pantalla sin los cuatro. |
| Tipos de la BD | Generados con `supabase gen types typescript` en cada migración (comprobado en CI). |
| Accesibilidad | Etiquetas en todos los campos, foco visible, objetivos táctiles ≥ 44 px, contraste AA, navegación por teclado en escritorio. |
| Responsive | Móvil primero (360 px). Navegación inferior en móvil, lateral en tablet/escritorio. Tablas que se convierten en tarjetas en móvil. |
| Fechas y dinero | Zona horaria de la organización (`America/La_Paz` por defecto). Dinero como `string`/`Decimal` en el cliente, nunca operado con `number` para totales oficiales: los totales los calcula la BD. |

### 2.1 Estructura de carpetas propuesta

```
src/
  app/
    (public)/login/            # autenticación
    (app)/layout.tsx           # shell autenticado: navegación, selector de inventario
    (app)/inicio/
    (app)/inventario/[inventoryId]/{productos,movimientos,kardex,existencias}/
    (app)/ventas/  (app)/cobros/  (app)/clientes/
    (app)/compras/ (app)/pagos/   (app)/proveedores/
    (app)/reportes/
    (app)/configuracion/{negocio,usuarios,catalogos}/
    api/pdf/[report]/route.ts  # PDF en servidor
  modules/
    <modulo>/
      domain/       # funciones puras (cálculos, formatos) + pruebas unitarias
      schemas.ts    # Zod
      queries.ts    # lecturas (server-only)
      actions.ts    # Server Actions (mutaciones → RPC)
      components/   # componentes propios del módulo
      reports/      # definiciones de reporte (datos + columnas)
  components/ui/    # sistema de diseño
  lib/
    supabase/{server.ts,browser.ts,middleware.ts}
    errors.ts  result.ts  format.ts  dates.ts  logger.ts
supabase/
  migrations/      # SQL versionado
  tests/           # pgTAP: restricciones, RPC y RLS
  seed.sql         # datos de desarrollo (nunca producción)
scripts/
  import-prototype/  # importador del respaldo JSON (B7)
docs/roadmap/
prototipo/         # copia de referencia del prototipo original
```

### 2.2 Reportes sin triple implementación

El prototipo implementa cada reporte tres veces (HTML, PDF y texto). Se propone una **definición única de reporte** por módulo:

```ts
type ReportDefinition<P> = {
  id: string; title: string;
  load(params: P): Promise<ReportData>;      // consulta (vista/RPC en BD)
  sections: Section[];                        // resúmenes, tablas, columnas, totales
};
```

Renderizadores genéricos: `HtmlReport` (pantalla + impresión), `PdfReport` (servidor) y `TextReport` / `CsvReport`. Así un cambio de columna se hace una sola vez.

**PDF (D-10):** se recomienda generar en servidor con `@react-pdf/renderer` (resultado igual en todos los dispositivos, compatible con Web Share API para enviar el archivo) y mantener la vista HTML con estilos de impresión como alternativa inmediata.

## 3. Supabase y datos

### 3.1 Convenciones del esquema

- Claves primarias `uuid` (`gen_random_uuid()`); sin referencias por posición.
- Toda tabla de negocio lleva `organization_id uuid not null` (ver D-01), `created_at timestamptz`, `created_by uuid` y, si es editable, `updated_at`, `updated_by`.
- **Fecha de negocio** (`*_date date`) separada de la **marca de registro** (`created_at`). Los reportes usan la fecha de negocio.
- Dinero `numeric(14,2)`; cantidades `numeric(14,3)`; nunca `float`.
- `check` para importes y cantidades positivos; `unique` donde aplique (`(organization_id, lower(name))`, números de documento).
- Enumeraciones estables como tipos `enum` o `check`; listas que el negocio puede cambiar (modalidades de venta, motivos, categorías) como **tablas de catálogo**.
- Documentos con estado (`draft` → `posted` → `voided`, o `open` → `closed`). Un documento `posted` no se edita: se anula y se emite otro.
- Tablas de libro (movimientos de inventario, pagos, asignaciones) **solo de inserción**: sin `UPDATE`/`DELETE` para el rol `authenticated`.
- `client_request_id uuid unique` en las operaciones creadas desde formularios, para que un doble toque o un reintento no duplique una venta (idempotencia).

### 3.2 Seguridad: Auth, roles y RLS

- **Auth:** Supabase Auth con correo y contraseña; alta de usuarios **por invitación** del propietario/administrador (sin registro público).
- **Membresía:** `memberships(organization_id, user_id, role, active)`.
- **Roles MVP** (D-04):

| Permiso | owner | admin | operator | viewer |
|---|:-:|:-:|:-:|:-:|
| Ver todo el negocio | ✅ | ✅ | ✅ | ✅ |
| Configurar negocio, inventarios, catálogos | ✅ | ✅ | | |
| Gestionar usuarios y roles | ✅ | ✅¹ | | |
| Registrar ventas, cobros, ingresos, salidas | ✅ | ✅ | ✅ | |
| Registrar compras y pagos a proveedores | ✅ | ✅ | ✅² | |
| Ajustes de inventario | ✅ | ✅ | | |
| Anular ventas, compras, pagos, movimientos | ✅ | ✅ | ✅³ | |
| Ver auditoría | ✅ | ✅ | | |

¹ no puede crear ni degradar a un `owner`. ² confirmable (P-11). ³ propuesta: solo operaciones propias del mismo día; el resto, admin (D-09).

Roles posteriores: `field` (campo: conteos y envíos, B9), `fund_holder` (responsable de fondos: solo sus cargos, B8).

- **RLS:** habilitado en **todas** las tablas expuestas. Funciones auxiliares `security definer stable` con `search_path` fijo:
  - `app.is_member(org uuid) returns boolean`
  - `app.has_role(org uuid, roles text[]) returns boolean`
- Políticas típicas: `select using (app.is_member(organization_id))`; sin políticas de `insert/update/delete` en tablas de libro (solo se escribe mediante RPC).
- **Funciones RPC de negocio** `security definer` con verificación explícita de rol al inicio (`app.require_role(...)`), `set search_path = ''` y nombres calificados. Se otorgan con `grant execute ... to authenticated`.
- **Claves:** la clave `service_role` **nunca** llega al navegador ni a variables `NEXT_PUBLIC_*`. Solo la usan scripts administrativos (importador) ejecutados por una persona autorizada, o tareas de servidor muy acotadas.

### 3.3 Estrategia de transacciones

Cada operación que toca varias tablas es **una función PostgreSQL** (una transacción):

| RPC | Efectos atómicos |
|---|---|
| `inv_post_movement` | Inserta movimiento (apertura, ajuste, consumo, merma…) + actualiza `stock_balances` con bloqueo de fila + valida stock + auditoría. |
| `sales_post_sale` | Número de venta + cabecera + líneas + un movimiento de salida por línea + stock + (opcional) cobro inicial y asignación. |
| `sales_void_sale(sale_id, reason)` | Marca venta `voided` + contramovimientos de entrada + anula asignaciones de cobro (el dinero queda como saldo a favor o se anula el cobro, según D-12). |
| `ar_register_payment` | Cobro + asignaciones a una o varias ventas; valida que no supere el saldo. |
| `ar_void_payment` | Marca el cobro `voided`; los saldos se recalculan solos (vista). |
| `purch_post_purchase` / `purch_void_purchase` | Equivalentes para compras (entradas de stock + deuda). |
| `ap_register_payment` / `ap_void_payment` | Pagos a proveedores. |
| `cash_close_advance` (B8) | Verifica saldo cero (o registra devolución/reembolso) y cierra. |

**Concurrencia:** `select … for update` sobre las filas de `stock_balances` afectadas, en orden de `product_id` para evitar bloqueos mutuos. Numeración con tabla `document_sequences` bloqueada por fila (sin huecos por reintentos dentro de la misma transacción).

**Fechas pasadas (H-04, D-08):** al registrar con fecha anterior a hoy, la función verifica que el saldo acumulado del producto no sea negativo **en ninguna fecha posterior**. Se propone además un límite configurable de días hacia atrás.

### 3.4 Auditoría

- Columnas `created_by/at`, `updated_by/at` en todas las tablas.
- Tabla `audit_log(id, organization_id, table_name, record_id, action, old_data jsonb, new_data jsonb, actor_id, occurred_at, reason)` alimentada por un trigger genérico en tablas sensibles (productos, precios, documentos, pagos, membresías) y por las RPC de anulación (con motivo obligatorio).
- La auditoría es de solo inserción; nadie la edita.

## 4. Modelo conceptual

### 4.1 Diagrama (MVP + extensiones previstas)

```
organizations 1─* memberships *─1 profiles(auth.users)
organizations 1─* inventories 1─* stock_balances *─1 products
organizations 1─* products *─1 product_categories
                   products *─1 units
inventories 1─* inventory_movements *─1 products
                inventory_movements *─0..1 (sale_items | purchase_items)   [origen]
                inventory_movements 0..1─ reverses_movement_id (anulación)

parties (terceros: cliente / proveedor / productor)                       [D-05]
sales *─1 inventories ; sales *─0..1 parties ; sales *─1 sale_modalities
sales 1─* sale_items *─1 products
customer_payments *─1 parties ; customer_payments 1─* payment_allocations *─1 sales

purchases *─1 inventories ; purchases *─0..1 parties
purchases 1─* purchase_items *─1 products
supplier_payments 1─* supplier_payment_allocations *─1 purchases

── post-MVP ──
cash_advances (cargo a rendir) *─1 profiles|parties (responsable)
cash_advances 1─* cash_advance_entries *─0..1 expense_categories ; entries 0..1─ storage object
properties (predios) ; parties(productor)
shipments (hojas de envío) 1─* shipment_items *─1 properties, *─0..1 products
livestock_counts 1─* livestock_count_lines *─1 properties, parties, livestock_categories, age_classes
goal_boards 1─* goal_tasks
audit_log, document_sequences
```

### 4.2 Entidades

Leyenda de bloque: B2 acceso · B3 inventario · B4 ventas/CxC · B5 compras/CxP · B8 cargo · B9 ganadería · B10 metas.

| Entidad | Propósito | Relaciones / restricciones relevantes | Bloque |
|---|---|---|---|
| `organizations` | El negocio (hoy "Grupo Pecuario"). Moneda, zona horaria, nombre para reportes, configuración. | Raíz de todos los datos. `currency default 'BOB'`, `timezone default 'America/La_Paz'`. | B2 |
| `profiles` | Datos del usuario (nombre, teléfono). | 1:1 con `auth.users`. | B2 |
| `memberships` | Pertenencia de un usuario a una organización con un rol. | `unique(organization_id, user_id)`; al menos un `owner` activo por organización (trigger). | B2 |
| `audit_log` | Bitácora de cambios y anulaciones. | Solo inserción. | B2 |
| `document_sequences` | Numeración correlativa por tipo de documento (venta, compra, cobro, cargo, hoja). | `unique(organization_id, doc_type, scope_id)`. | B2/B4 |
| `inventories` | **Inventario independiente** del prototipo: agrupa productos y stock (línea de negocio y/o depósito). | `unique(organization_id, lower(name))`; `allow_negative_stock bool default false`; `archived_at` en vez de borrado. | B3 |
| `units` | Unidad de medida (unidad, kg, litro, bolsa, quintal, cabeza…). | `allows_decimals bool`. Catálogo semilla editable. Justificado por H-12 y por las unidades ya usadas en envíos. | B3 |
| `product_categories` | Agrupar productos para reportes (insumos veterinarios, alimento…). | Opcional por producto. | B3 |
| `products` | Producto vendible o inventariable. | `sale_price` (precio de venta vigente), `unit_id`, `category_id`, `min_stock`, `active`. **No hay costo en el producto**: el costo vive en los movimientos (y `stock_balances.last_cost`/`avg_cost`). Alcance por inventario según D-02. Nunca se borra si tiene movimientos: se desactiva (corrige H-03). | B3 |
| `product_price_history` | Historial de precios de venta. | Insertado por trigger al cambiar `sale_price`. | B3 (MP) |
| `stock_balances` | Existencia actual por (inventario, producto) y último costo. | PK compuesta; `check (quantity >= 0)` salvo inventario con negativos permitidos; mantenida solo por RPC. | B3 |
| `inventory_movements` | Kardex: cada entrada o salida de stock. | `kind` (`opening`, `purchase`, `sale`, `adjustment_in`, `adjustment_out`, `consumption`, `loss`, `donation`, `reversal`…), `quantity > 0`, `direction` (+/−), `unit_cost`, `movement_date`, `reason`, `source_type/source_id`, `reverses_movement_id`. Solo inserción. | B3 |
| `parties` | Terceros: clientes, proveedores, productores (D-05). | `name`, `normalized_name` (minúsculas, sin tildes) con índice para detectar duplicados; `is_customer`, `is_supplier`, `is_producer`; documento, teléfono. Corrige H-08. | B4 |
| `sale_modalities` | Formas/modalidades de venta: contado, crédito, intercambio, reproas. | `code`, `name`, `requires_customer`, `creates_receivable`, `counts_as_revenue`. Configurable porque "reproas" está pendiente (P-01). | B4 |
| `sales` | Documento de venta (cabecera). | `number` correlativo, `sale_date`, `inventory_id`, `customer_id` (obligatorio si la modalidad lo exige), `modality_id`, `destination` (texto; o `property_id` según P-09), `total` (calculado en RPC), `status posted/voided`, `void_reason`. | B4 |
| `sale_items` | Líneas de la venta. | `quantity > 0`, `unit_price >= 0`, `line_total`; genera un `inventory_movement`. | B4 |
| `customer_payments` | Cobro recibido (cada abono es un registro: corrige H-05). | `payment_date`, `amount > 0`, `method` (efectivo, transferencia, QR…), `reference`, `status`. | B4 |
| `payment_allocations` | Aplicación de un cobro a una o varias ventas. | `sum(allocations) <= payment.amount`; saldo de venta ≥ 0. | B4 |
| Vista `v_receivables` | Saldo por venta = total − asignaciones vigentes; estado *pendiente/cancelada*; antigüedad. | Fuente única para CxC y reportes (corrige H-06). | B4 |
| `purchases` / `purchase_items` | Compra (ingreso valorado) con proveedor y costo unitario. | Igual patrón que ventas; generan movimientos `purchase`. | B5 |
| `supplier_payments` / `supplier_payment_allocations` | Pagos a proveedores. | Igual patrón que cobros. | B5 |
| Vista `v_payables` | Saldo por compra. | | B5 |
| `payables` (obligaciones generales) | Deudas no ligadas a compras (servicios, préstamos…). | Solo si se confirma P-05; reutiliza `supplier_payment_allocations` polimórficas o tabla propia. | B5 ext. (MP) |
| `cash_advances` | **Cargo a rendir**: fondo entregado a un responsable. | `number`, `responsible_id`, `purpose`, `status open/closed`, `closed_at`, `closed_by`. Cerrado ⇒ inmutable (corrige H-09); reapertura solo admin con auditoría. | B8 |
| `cash_advance_entries` | Entregas, gastos, devoluciones y reembolsos del cargo. | `kind` (`disbursement`, `expense`, `refund`, `reimbursement`), `amount > 0`, `entry_date`, `description`, `expense_category_id`, `receipt_number`, `receipt_path` (Storage). | B8 |
| `expense_categories` | Clasificar gastos rendidos. | Catálogo. | B8 |
| `properties` | **Predio** ganadero. | `name` único, ubicación, `owner_party_id` opcional. Reemplaza los textos libres de envíos, contador y destino. | B9 |
| `shipments` / `shipment_items` | **Hoja de envío** y sus líneas (fecha, predio, detalle, cantidad, unidad, precio). | `product_id` opcional (vínculo con inventario según P-06); hoja cerrada inmutable. | B9 |
| `livestock_categories`, `age_classes` | Catálogos (vacas, toros…; 6 meses, 1 año, C-24…). | Semilla con los valores del prototipo. | B9 |
| `livestock_counts` / `livestock_count_lines` | **Conteo puntual** (sesión de conteo) y sus filas por predio, productor, categoría y edad. | Un conteo tiene fecha y estado; los reportes de "existencia" toman **el último conteo cerrado por predio**, nunca la suma de conteos (corrige H-10). | B9 |
| `livestock_movements` | Inventario vivo (nacimientos, muertes, compras, ventas, traslados). | **Futuro**, solo si P-08 lo confirma. | F |
| `goal_boards` / `goal_tasks` | Barras de metas y tareas. | `start_date <= end_date`; tarea dentro del período (corrige H-19); `assignee_id`, `done_at`, `done_by`. | B10 |

### 4.3 Cálculos que pasan a la base de datos

| Prototipo | Nuevo sistema |
|---|---|
| `stock()` recorre todos los movimientos | `stock_balances` mantenida en la misma transacción + verificación periódica contra la suma del kardex. |
| `paid` acumulado en el movimiento | Suma de `payment_allocations` de cobros vigentes (vista). |
| Pendiente de cobro = total de no cancelados (H-06) | Saldo real por venta (vista `v_receivables`). |
| Valor a precio de venta (H-07) | Dos columnas: a precio de venta vigente y a costo (último o promedio, D-06). |
| Conteos sumados (H-10) | Último conteo cerrado por predio. |

## 5. PWA

| Aspecto | Propuesta MVP |
|---|---|
| Instalación | `manifest.webmanifest` (nombre, nombre corto, `display: standalone`, colores, `start_url`, iconos 192/512 y *maskable*, iconos Apple). Botón "Instalar" en Android; guía breve para iOS. |
| Service worker | Serwist (o equivalente vigente al iniciar B7). Precaché del *app shell* y recursos estáticos con hash; **red primero** para navegaciones con página "Sin conexión" de respaldo. **No se cachean respuestas de datos** del negocio en el MVP (privacidad y consistencia). |
| Actualizaciones | El nuevo service worker espera; se muestra "Hay una versión nueva · Actualizar" y se activa con `skipWaiting` al aceptar. Las migraciones de BD deben ser compatibles con la versión anterior de la app durante el despliegue. |
| Estado de conexión | Indicador visible; formularios de escritura deshabilitados sin conexión con mensaje claro; los datos que el usuario escribió no se pierden al recuperar la señal (estado del formulario conservado). |
| Offline real | **No en el MVP.** Candidato justificado para después: **contador de ganado** y **envíos** en predios con mala cobertura (B11, EPIC-033): cola local en IndexedDB de registros *solo de inserción* con `client_request_id`, sincronización al reconectar; los conflictos son mínimos porque no se editan registros ajenos. Ventas y stock **no** se harán offline (riesgo de vender sin existencias). |

## 6. Despliegue y entornos

| Entorno | Frontend | Base de datos | Uso |
|---|---|---|---|
| Local | `next dev` | Supabase CLI (Docker) con `supabase db reset` + `seed.sql` | Desarrollo y pruebas |
| Staging | Vercel *preview* por rama/PR | Proyecto Supabase de staging | Validación funcional con datos de prueba e importación de ensayo |
| Producción | Vercel producción (rama `main`) | Proyecto Supabase de producción (región São Paulo `sa-east-1`, la más cercana a Bolivia) | Uso real |

- **Hosting recomendado (D-03):** Vercel + Supabase Cloud. Alternativa: Next.js en contenedor (Railway, Fly.io o VPS) si se requiere control de costos o datos en otra región.
- **Migraciones:** solo mediante archivos en `supabase/migrations`, aplicadas por CI a staging y, con aprobación manual, a producción. Nunca cambios manuales en el panel de producción.
- **CI (GitHub Actions):** lint, typecheck, pruebas unitarias, `supabase db reset` + pgTAP (restricciones, RPC, RLS), build; e2e con Playwright en flujos críticos (desde B4).
- **Respaldos:** respaldos automáticos de Supabase según plan (PITR si se contrata Pro) + exportación lógica programada (`pg_dump`) a un almacenamiento externo; simulacro de restauración en staging antes de salir a producción y luego trimestral.

## 7. Calidad (estrategia proporcional)

| Tipo | Qué cubre | Herramienta | Desde |
|---|---|---|---|
| Unitarias | Funciones puras de dominio: formatos, cálculos de reportes, transformaciones del importador | Vitest | B1 |
| Base de datos | Restricciones, RPC (casos felices y de error), stock nunca negativo, saldos, anulaciones | pgTAP vía Supabase CLI | B2 |
| Permisos / RLS | Matriz rol × tabla × operación; usuario de otra organización no ve nada | pgTAP con `set role` y JWT simulados | B2 |
| Integración | Server Actions contra BD local | Vitest + Supabase local | B3 |
| Flujos críticos e2e | Login, venta contado, venta crédito + cobro parcial, anulación, compra + pago, reporte diario | Playwright (móvil y escritorio) | B4 |
| Responsive | Capturas en 360, 768 y 1280 px de pantallas clave | Playwright | B3 |
| Concurrencia | Dos ventas simultáneas del último ítem: solo una pasa | pgTAP / script | B4 |
| Migración | Importación de respaldos de prueba (incl. formatos legados) con conciliación a 0 | Vitest + script en staging | B7 |
| Restauración | Restaurar respaldo de BD en staging y verificar conteos | Manual guiado + checklist | B7, B11 |

## 8. Decisiones técnicas pendientes (resumen)

| ID | Tema | Recomendación |
|---|---|---|
| D-01 | Multi-organización | `organization_id` en todo desde el inicio; UI de una sola organización en el MVP. |
| D-02 | Alcance del producto respecto del inventario | ✅ **Aprobado:** catálogo **por organización** con stock por inventario; consulta por inventario y global. |
| D-03 | Hosting | Vercel + Supabase Cloud (sa-east-1). |
| D-04 | Roles MVP | owner, admin, operator, viewer. |
| D-05 | Terceros | Tabla única `parties` con indicadores de rol. |
| D-06 | Valoración de inventario | MVP: precio de venta vigente y último costo; costo promedio ponderado como mejora prioritaria. |
| D-07 | Offline | Conexión obligatoria en el MVP. |
| D-08 | Fechas pasadas | Permitidas hasta N días (configurable, propuesta 31) con verificación de saldo en fechas posteriores. |
| D-09 | Edición vs. anulación | ✅ **Aprobado:** borrado lógico con motivo (estado anulado + quién/cuándo/por qué), efectos revertidos en la misma transacción; nunca borrado físico. |
| D-10 | PDF | `@react-pdf/renderer` en servidor + vista imprimible. |
| D-11 | Monedas | Solo bolivianos (BOB); campo `currency` en la organización para no cerrar la puerta. |
| D-12 | Cobro asignado a venta anulada | El cobro se anula junto con la venta (MVP); saldos a favor como futuro. |

Detalle, ventajas, desventajas e impacto en `06-riesgos-y-decisiones.md`.
