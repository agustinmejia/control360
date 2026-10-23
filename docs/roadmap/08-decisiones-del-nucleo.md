# 08 · Decisiones del núcleo (aprobadas 2026-10-23)

> Este documento **prevalece** sobre las recomendaciones anteriores de `05` y `06` cuando hay diferencias. Son las reglas del núcleo que no deben cambiar en el futuro.

## 0. Rol del prototipo

El prototipo es **referencia de funcionalidades y del negocio**, no fuente de lógica. Sus cálculos se reescriben correctamente; en particular se aplican las correcciones H-06 (pendiente de cobro = saldo real) y H-10 (existencia de ganado = último conteo, nunca la suma de conteos).

## 1. Empresa única con sucursales (N-5, reemplaza D-01)

- **Una empresa por despliegue.** Los datos de la empresa (nombre, logo, moneda BOB, zona horaria `America/La_Paz`) viven en una tabla de configuración de **fila única** (`company_settings`).
- **No se usa `organization_id`** en las tablas: la RLS se basa en el usuario autenticado, su rol y, más adelante, sus sucursales.
- **Sucursales** (`branches`): cada inventario pertenece a una sucursal (`inventories.branch_id`). Una sucursal puede tener varios inventarios (almacén, tienda, etc.).
- Permiso por sucursal (que un usuario solo vea su sucursal): previsto en el esquema (`user_branches`), activable cuando haga falta.

## 2. Productos derivados y presentaciones (N-1)

**Propuesta del propietario:** productos que derivan de otros en diferentes unidades, para saber cuántos kg y cuántos sacos hay.

**Opinión técnica: de acuerdo, con un modelo de "producto base + presentaciones con stock propio".**

```
Producto base: "Alimento balanceado X"     unidad base: kg
 ├─ Presentación "Saco 40 kg"     factor 40   (stock propio: sacos cerrados)
 └─ Presentación "Kg (suelto)"    factor 1    (stock propio: kg sueltos)
```

- Cada **presentación** es lo que se compra, vende, transfiere y cuenta: tiene su propio stock, código, precio y kardex. Para el usuario es "un producto".
- Todas las presentaciones de un mismo producto base comparten la **unidad base** y declaran su **factor** (cuántas unidades base contiene).
- **Fraccionamiento:** abrir un saco es un movimiento atómico de tipo `conversion`: sale 1 "Saco 40 kg" y entran 40 "Kg (suelto)". Opcionalmente se registra una merma en la misma operación (ej.: entran 39,5 kg y 0,5 kg de merma).
- **Consultas que permite:**
  - por presentación: *12 sacos y 23,5 kg sueltos*;
  - por producto base, en unidad base: *12 × 40 + 23,5 = 503,5 kg*;
  - todo, por inventario, sucursal o global.
- **Por qué no un solo stock en kg con conversiones al vender:** no permitiría saber cuántos sacos **cerrados** quedan, que es justamente lo que se quiere controlar.
- **Por qué no productos totalmente independientes:** se perdería el total en kg y el vínculo para fraccionar.
- Un producto que no se fracciona tiene una sola presentación con factor 1 (caso más común; la interfaz lo oculta).
- Factor y unidad base de una presentación **no se editan** una vez que tiene movimientos (cambiarlos alteraría el historial); se crea otra presentación.

Tablas: `products` (producto base: nombre, categoría, unidad base) y `product_variants` (presentación: nombre, factor, SKU, precio base, mínimo, activo). Stock, movimientos y líneas de documentos referencian siempre `product_variant_id`.

## 3. Precios (N-2)

- **Precio base** en la presentación y **precio opcional por inventario** (`inventory_prices`), para operar en ciudades distintas. Precio vigente = precio del inventario si existe; si no, el base.
- **Al registrar una compra** se puede, por línea, actualizar el precio base y/o los precios por inventario (casillas opcionales con el precio sugerido).
- Todo cambio de precio queda en un **historial de precios** con fecha, usuario y origen (manual o compra N°…).
- Las ventas guardan el precio aplicado: cambiar precios nunca altera ventas pasadas.

## 4. Compras centralizadas y traspasos (N-3)

- Las compras se registran **en un inventario** (cabecera con un inventario).
- La mercadería se reparte con **traspasos** entre inventarios (también entre sucursales): documento con número, origen, destino, líneas; genera atómicamente una salida en origen y una entrada en destino al **mismo costo**.
- Los traspasos **entran al MVP** (se mueven desde EPIC-034 a EPIC-011).
- Estado "en tránsito" (envío y recepción separados): **no en el MVP**; se puede agregar sin cambiar el modelo (estado del documento).
- Ventas también son de **un inventario por documento**.

## 5. Stock nunca negativo (N-4)

- Restricción en la base de datos `quantity >= 0` en `stock_balances`, **sin excepción configurable**.
- Se valida también en fechas posteriores al registrar con fecha pasada.

## 6. Fechas y anulaciones (N-6)

- Registro con fecha pasada hasta **31 días** (configurable en `company_settings`).
- El operador anula sus propias operaciones del mismo día; el administrador, el resto.

## 7. Dinero: nada se borra, solo asientos inversos

- Ventas, cobros, compras, pagos, cargos y sus efectos en stock **nunca se borran ni se editan**.
- Anular = registrar un **asiento inverso** (documento o movimiento de reversa que referencia al original, con motivo); el original queda marcado como anulado y enlazado a su reversa. Los saldos son siempre la suma de asientos.
- Para datos que no son dinero (productos, clientes, inventarios, sucursales, usuarios) se usa **borrado lógico** (desactivar/archivar) con motivo.
- No existe ningún `DELETE` físico disponible para usuarios.

## 8. Bitácora de acciones (auditoría)

Tabla `audit_log` de solo inserción, que registra **toda acción** de escritura:

| Campo | Contenido |
|---|---|
| `action` | Categoría: `create`, `update`, `void` (anulación/asiento inverso), `deactivate`, `reactivate`, `close`, `reopen`, `transfer`, `adjust`, `price_change`, `role_change`, `login`, `import`, … |
| `severity` | `normal` o `critical` — ver lista abajo |
| `module` | `inventory`, `sales`, `receivables`, `purchases`, `payables`, `cash`, `livestock`, `goals`, `security`, `settings` |
| `entity` / `entity_id` | Tabla y registro afectados |
| `old_data` / `new_data` | Valores previo y nuevo (en `update`, se guardan solo los campos que cambiaron en `changed_fields`) |
| `reason` | Motivo (obligatorio en anulaciones, ajustes, reaperturas) |
| `actor_id`, `occurred_at`, `ip`, `user_agent` | Quién, cuándo y desde dónde |

**Acciones críticas** (filtro "acciones críticas" para el propietario): anulaciones de cualquier documento, ajustes de inventario, cambios de precio, traspasos, reaperturas de documentos cerrados, cambios de rol/alta/baja de usuarios, cambios de configuración de la empresa, importaciones de datos, registros con fecha pasada.

La bitácora se escribe **en la base de datos** (triggers y funciones de negocio), de modo que ninguna escritura puede omitirla aunque se haga fuera de la interfaz. Nadie puede editarla ni borrarla.

## 9. Impacto en el roadmap

| Cambio | Dónde |
|---|---|
| Sin `organization_id`; `company_settings`, `branches`, `user_branches` | B2 (EPIC-007), `05` |
| Productos base + presentaciones + fraccionamiento | B3 (EPIC-010 y EPIC-011) |
| Precios por inventario + actualización desde la compra + historial | B3 (EPIC-010), B5 (EPIC-017) |
| Traspasos entre inventarios en el MVP | B3 (EPIC-011) |
| Bitácora categorizada con severidad | B1 (tabla y trigger base) y B2 (EPIC-008) |
| Asientos inversos en dinero | B4, B5 (EPIC-016, EPIC-018) |
