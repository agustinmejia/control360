# 01 · Análisis del prototipo

> **Fuente analizada:** `prototipo/Control_de_inventario_1.html` (copia fiel del archivo entregado; SHA-256 `08df14e3…befb26`).
> Las referencias `L123` remiten a números de línea de ese archivo.
> **Datos reales:** no se entregó ningún respaldo JSON con datos de uso. Todo lo que sigue se dedujo del **código**; las conclusiones que dependen de los datos reales están marcadas como *pendientes de verificación*.

Convención usada en este documento:

- ✅ **Comprobado**: se verificó leyendo el código.
- ⚠️ **Diferencia**: lo que el código hace difiere de lo que se describió en el encargo.
- 🐞 **Defecto / riesgo**: error de consistencia, validación insuficiente o comportamiento peligroso.
- ❓ **Ambigüedad**: no puede resolverse con el código; genera una pregunta de negocio (ver `06-riesgos-y-decisiones.md`).

---

## 1. Inventario técnico del prototipo

| Aspecto | Hallazgo |
|---|---|
| Archivos | **Uno solo**: HTML + CSS (L7–86) + JS (L90–719). No hay archivos relacionados en el repositorio. |
| Dependencias externas | `jsPDF 2.5.1` desde cdnjs (L5); fuente *Bricolage Grotesque* desde Google Fonts (L6). Sin ellas (sin conexión) los PDF no se generan y se usa un texto plano de respaldo. |
| Logo | Imagen JPEG embebida en base64 (`LOGO`, L354, ~57 KB), usada como marca de agua en pantalla y en PDF. |
| Arquitectura | Estado global `S` en memoria → se re-renderiza toda la página con `innerHTML` en cada acción (`render()`, L707). Eventos con atributos `onclick="..."` en línea. |
| Persistencia | `localStorage`, clave única `inv`, todo el estado serializado como un único JSON (`save()`, L95; carga en L94). Si `localStorage` no está disponible (`LSOK=false`), la app funciona pero **pierde todo al cerrar** y lo advierte (L700). |
| Entorno de origen | Usa `window.claude.use('downloads')` para guardar PDF y respaldos (L297, L685). Indica que el prototipo se construyó para ejecutarse como *Artifact* de Claude. Fuera de ese entorno el respaldo cae a "copiar texto" (L698) y el PDF a compartir con `navigator.share` o a imprimir. |
| Moneda / idioma | Bolivianos (`Bs`, formato `es`, 2 decimales, L96). Fechas locales del navegador. |
| Responsive | Diseño *mobile-first*, ancho máximo 560 px (L18), navegación inferior fija para el módulo de inventario (L70), soporte de *safe areas* y modo oscuro automático (L8–10). |
| PWA | **No existe**: no hay manifiesto, ni *service worker*, ni iconos. |
| Usuarios | **No existen**: no hay autenticación, roles, autoría de registros ni multi-dispositivo. |
| Identificadores | `Date.now().toString(36)` (productos, inventarios) y `uid()` = timestamp + 3 caracteres aleatorios (barras, contadores). Movimientos, cargos, envíos, tareas y filas de conteo **no tienen id**: se referencian por su **posición en el arreglo**. |
| Escape HTML | Función `esc()` (L97) aplicada de forma consistente a textos de usuario. No escapa comillas simples, pero los valores que van dentro de `onclick` son ids internos, no texto libre. Riesgo XSS bajo en el contexto actual (un solo usuario local). |

### 1.1 Navegación y pantallas

```
Inicio (vHome, L397)
├── Inventario ──► Selector de inventarios (vInvSel, L562) si hay más de uno
│     Barra inferior (TABS, L705):
│     Productos · Movimiento · Kardex · Cobrar · Pagar · Día · Mes
├── Cargo a rendir (vCargo, L426)
├── Control de predios ganaderos (vGan, L487) ── Envíos · Por predio · Por mes
├── Barra de metas diarias (vMeta, L602)
├── Contador de ganado (vCont, L654)
└── Copia de seguridad / restauración (vBk, L695) — al pie de Inicio
```

---

## 2. Estructura real de los datos (`localStorage['inv']`)

```jsonc
{
  "biz": "Grupo Pecuario",              // nombre del negocio (por defecto, L229)
  "invName": "Inventario principal",    // nombre del inventario ACTIVO
  "products": [ { "id": "lq3x…", "name": "…", "price": 120.5 } ],     // del inventario activo
  "moves": [                                                           // del inventario activo
    // Ingreso (compra o saldo inicial)
    { "t": 1730000000000, "pid": "lq3x…", "type": "in",  "qty": 10,
      "prov": "Proveedor X", "cost": 95, "paid": 0, "canc": false, "fpago": "" },
    // Salida (venta o egreso sin valor)
    { "t": 1730000000000, "pid": "lq3x…", "type": "out", "qty": 2,
      "price": 120.5, "pay": "contado|credito|intercambio|reproas|ninguno",
      "client": "Juan", "dest": "Predio Y", "paid": 241, "canc": true, "fpago": "2026-10-20" }
  ],
  "invOthers": [ { "id": "…", "name": "Insumos veterinarios", "products": [...], "moves": [...] } ],

  "cargo":  [ { "d": "2026-10-01", "k": "in|out", "det": "Entrega de fondos", "a": 500 } ],
  "cargoH": [ { "closed": "2026-09-30", "items": [ ...mismo formato... ] } ],

  "env":  [ { "d": "2026-10-02", "pr": "Predio A", "det": "Sal mineral", "q": 3.5, "u": "Bolsa", "p": 80 } ],
  "envH": [ { "closed": "2026-09-30", "items": [ ... ] } ],

  "bars":   [ { "id": "…", "name": "Barra de metas 1", "from": "", "to": "",
                "tasks": [ { "d": "2026-10-03", "det": "Vacunar lote 2", "ok": false } ] } ],
  "barSel": "…",

  "cnts":   [ { "id": "…", "name": "Contador 1",
                "rows": [ { "d": "2026-10-04", "p": "Predio A", "o": "Productor", "c": "Vacas", "e": "2 años", "n": 35 } ] } ],
  "cntSel": "…",
  "kMay": 1,                            // marca de migración interna "Adulto" → "Mayor"

  "lastBackup": "2026-10-10"
}
```

**Evidencias de versiones anteriores del esquema** (el prototipo migra datos viejos al vuelo, por lo que un respaldo real puede venir en cualquiera de estas formas):

| Indicio | Dónde | Implicación para la migración |
|---|---|---|
| Movimientos sin `canc`: una salida `contado` se considera cancelada; un ingreso sin `canc` no tiene estado de pago. | `isCanc`, `fpay`, `estL` (L343–345) | El importador debe aplicar las mismas reglas de compatibilidad. |
| `S.metas` (lista única de tareas) → convertida en `S.bars[0]`. | `bars()` L569 | Aceptar ambas formas. |
| `S.ko` / `S.kr` (contador único) → convertidos en `S.cnts[0]`. Edad "Adulto" renombrada a "Mayor". | `koCs()` L625 | Aceptar ambas formas y normalizar "Adulto". |
| Formato de respaldo `{app, v:1, fecha, datos:S}`, pero la restauración también acepta `S` sin envoltorio. | L684, L691 | El importador debe aceptar ambas. |

---

## 3. Funcionalidades comprobadas por módulo

### 3.1 Inventario

| Funcionalidad | Estado | Detalle |
|---|---|---|
| Catálogo de productos | ✅ | Solo `nombre` y `precio` (precio de venta). Nombre y precio editables en línea (L117, L120). Sin categoría, unidad, código, costo ni estado activo/inactivo. |
| Existencia inicial | ✅ | Al crear el producto, el "saldo inicial" genera un movimiento `in` **sin proveedor ni costo** (L113). En el kardex es indistinguible de una compra (aparece como "Ingreso"). |
| Entradas (ingresos) | ✅ | Fecha, producto, cantidad entera, proveedor (texto libre), **precio unitario de compra** (`cost`), monto cancelado, estado y fecha de pago (L137, L221). Un ingreso con costo genera una **cuenta por pagar**. |
| Salidas (ventas) | ✅ | Ver §3.2. No existen salidas de otro tipo explícitas (merma, consumo, ajuste); la única aproximación es la forma de pago `-` ("ninguno"). |
| Ajustes de stock | ⚠️ No existen | La única forma de corregir es **editar o borrar** movimientos. |
| Kardex por producto | ✅ | Saldo acumulado cronológico, totales de ingresos y salidas (`kRows`, L238). **Solo en unidades**: no hay kardex valorado. |
| Existencias valoradas ("Inventario general") | ✅ con ⚠️ | `saldo × precio de venta actual` (`invRows`, L239). **No usa el costo de adquisición**; cambiar el precio de venta revaloriza todo el inventario retroactivamente. |
| Inventarios independientes | ✅ | Ver §3.1.1. |
| Alerta de stock bajo | ✅ parcial | Saldo ≤ 3 se pinta en rojo (L212). Umbral fijo, no configurable. |

#### 3.1.1 Qué es un "inventario independiente" en el prototipo

- Es un **conjunto completo y aislado** de `products` + `moves` con un nombre (L544–553). El ejemplo de la interfaz es *"Insumos veterinarios"* (L556): sugiere **líneas de negocio o grupos de productos distintos**, no necesariamente almacenes físicos.
- Solo uno está "activo": sus datos viven en `S.products`/`S.moves`; los demás se guardan en `S.invOthers` y se intercambian al abrirlos (`switchInv`, L548).
- No hay productos compartidos, transferencias entre inventarios ni reportes consolidados. Cuentas por cobrar/pagar y reportes son **por inventario**.
- El nombre del negocio (`biz`) es global; la cabecera de los reportes muestra `negocio · inventario` (L235).

**Representación propuesta** (detallada en `05-arquitectura-y-modelo-de-datos.md`): tabla `inventories` dentro de la organización; todos los movimientos, ventas y compras referencian `inventory_id`. ❓ Debe confirmarse si un mismo producto puede existir en dos inventarios (catálogo compartido) o si cada inventario tiene su propio catálogo (comportamiento actual).

### 3.2 Ventas y cobros

Una **venta es un movimiento `out` de un solo producto** (no hay cabecera de venta con varias líneas, ni número de comprobante).

| Campo / regla | Comprobado |
|---|---|
| Fecha (puede ser pasada); si es hoy se guarda la hora real, si es otra fecha se guarda las 12:00 (`tstamp`, L104). | ✅ |
| Precio unitario: se propone el precio del producto y es editable (L131). El precio queda guardado en el movimiento; cambiar el precio del producto no altera ventas pasadas (L213). | ✅ |
| Cantidad entera > 0 (`parseInt`: **2,5 se convierte en 2 sin avisar**). | ✅ 🐞 |
| Formas de pago: `contado`, `credito`, `intercambio`, `reproas`, `ninguno` (mostrado como "-"). | ✅ |
| Cliente obligatorio **solo** para crédito (L141). "Destino del producto" opcional, texto libre. | ✅ |
| Estado `Pendiente` / `Cancelado` (cancelado = pagado). Por defecto una salida nueva es "Cancelado"; al elegir otra forma de pago que no sea contado, cambia a "Pendiente" (`payChg`, L349). | ✅ |
| Monto cancelado: vacío → según estado (0 o total); no puede superar el total (L144–147). Si el pagado llega al total, se marca cancelado automáticamente. | ✅ |
| Fecha de pago "o de intercambio" (`fpago`): **una sola fecha** por operación. | ✅ |
| Control de stock: no permite registrar una salida que deje el saldo **final** negativo (L149). | ✅ con 🐞 (ver §5) |
| "Marcar cancelado": pone pagado = total y fecha de pago = hoy (L348). | ✅ |
| Forma de pago `ninguno`: importe **0**; descuenta stock pero no suma a ventas. Se cuenta como "transacción" y en "unidades vendidas" (L169). | ✅ ❓ |

**Pagos parciales:** existen, pero **no hay historial de pagos**. Cada operación guarda un único acumulado `paid` y una única fecha `fpago`; registrar otro abono implica **editar** la operación y sobrescribir el monto y la fecha. No se puede saber cuándo ni cuánto se pagó en cada abono.

**Modalidades particulares:**

- **Intercambio**: se valora con el precio de venta y se reporta por separado. Puede quedar "Pendiente" (aparece entonces como cuenta por cobrar). **No se registra qué se recibió a cambio** ni entra nada al inventario. ❓
- **Reproas**: se trata exactamente igual que contado/crédito a efectos de cálculo y se reporta en una línea propia. **El código no da ninguna pista sobre su significado** (no hay campos adicionales ni textos de ayuda). ❓ *No se inventa una regla: se deja como pregunta de negocio P-01.*
- **Contado pendiente**: el sistema permite registrar una venta al contado con estado "Pendiente" y sin cliente; aparece en cuentas por cobrar como "Sin cliente". ❓

### 3.3 Cuentas por cobrar (pestaña "Cobrar", `vAcc('c')`, L377)

- Se **derivan** de las salidas con saldo (`total − pagado`) > 0,004 Bs (`accData`, L370). No hay entidad propia.
- Agrupación por **nombre de cliente en texto libre**, coincidencia exacta y sensible a mayúsculas: "Juan Pérez" y "juan perez" son dos clientes distintos. Las salidas sin cliente se agrupan como "Sin cliente".
- Vistas: **General** (resumen por cliente: operaciones, total, cancelado, saldo) y **Por cliente** (detalle de operaciones de uno o todos).
- ⚠️ **Solo muestra operaciones pendientes.** Las operaciones canceladas solo se ven en los reportes diario/mensual y en "Últimos movimientos". No existe un estado de cuenta histórico del cliente.
- No hay antigüedad de saldos, fechas de vencimiento ni límite de crédito.

### 3.4 Cuentas por pagar (pestaña "Pagar", `vAcc('p')`)

- Mismo mecanismo que CxC, aplicado a **ingresos de inventario** con costo y saldo > 0. Agrupación por proveedor (texto libre) o "Sin proveedor".
- ⚠️ **Solo existen obligaciones originadas en compras de productos del inventario.** No se pueden registrar gastos, servicios, préstamos, sueldos ni otras deudas. No hay distinción entre proveedor y acreedor.
- Un ingreso sin costo (por ejemplo, el saldo inicial) tiene total 0 y nunca es deuda.

### 3.5 Reportes operativos

| Reporte | Contenido real | Formatos |
|---|---|---|
| **Reporte diario de ventas** (`vRep(false)`, L186) | Selector de fecha y de productos a incluir. 1) Resumen: total, contado, crédito, intercambio, reproas, pendiente de cobro, transacciones, unidades vendidas, unidades ingresadas. 2) Productos vendidos (cantidad, precio promedio, importe), más y menos vendido. 3) Detalle de ventas con hora, cliente/destino, pago, estado, fecha de pago, importe. 4) Detalle de ingresos (con proveedor, costo, pagado, saldo). | Pantalla, impresión, PDF, texto para compartir |
| **Reporte mensual de ventas** (`vRep(true)`) | Igual que el diario + venta por día; detalle con precio unitario, cancelado y saldo. | Ídem |
| **Kardex por producto** (`vKar`, L247) | Precio, saldo, totales; movimientos con saldo acumulado. | Ídem |
| **Inventario general** | Existencias valoradas a precio de venta + listados completos de ingresos y egresos de toda la historia. | Ídem (PDF con marca de agua) |
| **Cuentas por cobrar / por pagar** | Resumen o detalle (ver §3.3–3.4). | Ídem |
| Cargo a rendir, hojas de envío, reportes por predio y por mes, metas diarias, contador de ganado | Ver módulos. | Pantalla, impresión, PDF (sin texto de respaldo en varios) |

Todos los documentos llevan cabecera (negocio, título, período, fecha de emisión), numeración de páginas en PDF y líneas de firma "Elaborado por / Revisado por".

**Reportes que no existen y harían falta para decidir:** margen bruto (requiere costo), ventas por cliente y por período, antigüedad de cuentas por cobrar, flujo de cobros por fecha de pago (hoy los reportes agrupan por fecha de la venta, no por fecha del cobro), existencias bajo mínimo, movimientos de inventario por motivo, consolidado de varios inventarios, cierre de caja diario por forma de pago efectivamente cobrada.

### 3.6 Cargo a rendir (L403–461)

- **Un único cargo "actual"** con registros `{fecha, tipo ingreso|gasto, detalle, monto}`. Ingreso = dinero entregado; gasto = dinero gastado (texto de ayuda en L433).
- **Saldo a rendir** = Σ ingresos − Σ gastos, con saldo acumulado por fila; puede quedar **negativo** (se pinta en rojo, sin bloqueo).
- "Nuevo cargo a rendir": **cierra** el actual con la fecha de hoy, lo pasa al historial numerado (N° 1, 2, …) y empieza uno vacío (L423). **No exige que el saldo sea cero**, no registra devolución ni reembolso, no arrastra el saldo al siguiente.
- ⚠️ **No hay responsable**: el cargo no indica a quién se entregaron los fondos. Solo puede existir un cargo abierto a la vez, por lo que no es posible gestionar fondos simultáneos de varias personas.
- ⚠️ **No hay comprobantes** (número de factura/recibo, adjuntos) ni categorías de gasto.
- 🐞 Los cargos **cerrados siguen siendo editables** (agregar, editar, borrar registros), explícitamente permitido por la interfaz (L432). El cierre no es definitivo.
- Reportes: cargo individual y "Reporte de todos los cargos" (resumen + detalle de cada uno).

### 3.7 Control de predios ganaderos (L462–540)

⚠️ **Diferencia importante con el encargo:** el módulo **no registra movimientos de ganado entre predios**. Registra **"envíos" valorados a predios** en "hojas de envío":

- Registro: `{fecha, predio (texto libre con sugerencias), detalle del producto (texto libre), cantidad decimal, unidad de medida (sugerencias: Kg, Cabeza, Litro, Unidad, Bolsa, Quintal, Tonelada, Caja, Arroba, Paquete), precio unitario}`; total = cantidad × precio.
- Por las unidades sugeridas se infiere que se envían **insumos y productos** (sal, alimento, combustible…) y eventualmente **cabezas de ganado**. ❓ Debe confirmarse qué se envía, desde dónde y por qué se valora (¿costo cargado al predio? ¿venta al predio?).
- **No está conectado con el inventario**: un envío no descuenta existencias, aunque el producto enviado pueda estar también en el inventario. Riesgo de doble registro.
- Hojas de envío: misma mecánica que el cargo a rendir (hoja actual → cerrar → historial numerado; las cerradas siguen editables, L499).
- Reportes: hoja de envío; **por predio** (todas las hojas, agrupado por predio, con subtotales); **mensual** (resumen por predio y detalle, filtrable por predio).
- No hay productor/propietario, origen, transportista, documento de traslado ni estado de recepción.

### 3.8 Contador de ganado (L624–682)

- Varios **contadores** con nombre (ej.: "Conteo octubre"). Cada uno es una lista de filas `{fecha de trabajo, predio, productor, categoría, edad, cantidad}`.
- Catálogos sugeridos (texto libre con autocompletar): categorías *Vacas, Toros, Torillos, Terneros, Terneras, Novillos, Vaquillas, Bueyes*; edades *6 meses, 1 año, 2 años, 3 años, C-24, C-25, C-26, C-27, Mayor*. Los predios sugeridos se toman también de los envíos (único vínculo entre módulos).
- Botones **+ / −** por fila para contar en el campo (`adjKo`, L628). Se puede llegar a 0 (la fila queda), aunque al crear se exige > 0.
- Filtro por fecha de trabajo; reportes: detalle, **resumen por productor**, **resumen por categoría + edad**.
- ⚠️ **Es una planilla de conteo puntual, no un inventario de animales**: no hay altas, bajas, nacimientos, muertes, compras ni ventas de ganado; no hay identificación individual. Con el filtro "Todas las fechas" **se suman conteos de días distintos**, lo que duplica el ganado si el mismo rodeo se contó dos veces. 🐞
- Las agrupaciones de este módulo sí ignoran mayúsculas (a diferencia de CxC/CxP).
- ❓ Significado de las edades "C-24…C-27" (¿camada/generación del año 2024–2027? ¿marca?). Pregunta P-07.

### 3.9 Barra de metas diarias (L567–623)

- Varias **barras de metas** con nombre y período opcional (inicio/fin, validado inicio ≤ fin).
- Tareas `{fecha, detalle, ejecutada sí/no}`; vista por día con % de ejecución, avance general de la barra y avance por fecha.
- No valida que las tareas estén dentro del período de la barra. No hay responsable, prioridad ni recurrencia.
- PDF por día con filas ejecutadas resaltadas en verde.
- Funcionalmente **independiente** de los demás módulos (no lee ni escribe datos de otros).

### 3.10 Respaldo, restauración, impresión y exportación

| Función | Comportamiento |
|---|---|
| Guardar copia (`backupSave`, L684) | JSON completo `{app:'grupo-pecuario', v:1, fecha, datos:S}`. Dentro del entorno Claude se descarga; fuera de él se muestra en un cuadro de texto para copiar (WhatsApp, notas). Registra `lastBackup` y recuerda hacer copia cada 7 días. |
| Restaurar (`prepRestore`, L690) | Desde archivo o texto pegado. **Validación mínima**: solo comprueba que existan `products` y `moves` como arreglos. Muestra conteo y pide confirmación. **Reemplaza todo** el estado (todos los inventarios y módulos); sin fusión ni verificación de versión. |
| Imprimir | `window.print()` con hoja de estilos de impresión que oculta la navegación y los controles (L56). |
| PDF | jsPDF en el navegador (A4, tablas con salto de página, marca de agua, pie con número de página). Se comparte con Web Share API (archivos) o se descarga en el entorno Claude; si no, sugiere imprimir. |
| Texto para compartir | Reportes de ventas, inventario, kardex, CxC/CxP y cargo tienen versión en texto plano (para WhatsApp), usada cuando jsPDF no está disponible. |
| CSV / Excel | **No existe.** |

---

## 4. Flujos de uso reconstruidos

1. **Alta de producto** → nombre + precio de venta + saldo inicial → se crea producto + ingreso inicial.
2. **Compra** → Movimiento › Ingreso → producto, cantidad, proveedor, costo unitario → (opcional) monto pagado/estado → aumenta stock; si queda saldo, aparece en "Pagar".
3. **Venta al contado** → Movimiento › Salida → producto, cantidad, precio (propuesto), contado → cancelado hoy → baja stock; suma a ventas del día.
4. **Venta a crédito** → igual, con cliente obligatorio, estado pendiente → aparece en "Cobrar".
5. **Cobro** → en "Últimos movimientos" (solo los 10 más recientes, L224) botón "Marcar cancelado" (pago total con fecha de hoy) **o** "Editar" para escribir un pago parcial acumulado. ⚠️ Para cobrar una venta antigua que ya no está entre los 10 últimos **no hay acceso desde la interfaz**: "Cobrar" es solo de consulta (no tiene botones de acción). 🐞
6. **Corrección** → "Editar" o "Anular" un movimiento (la anulación lo **borra** físicamente).
7. **Cierre del día/mes** → Reporte Día/Mes → elegir productos → PDF/imprimir/compartir.
8. **Fondos a rendir** → registrar ingreso (entrega) → registrar gastos → reporte → "Nuevo cargo" (cierre).
9. **Envíos a predios** → registrar envíos en la hoja actual → reportes por predio/mes → cerrar hoja.
10. **Conteo en campo** → crear contador → agregar filas por productor/categoría/edad → ajustar con +/− → reporte.
11. **Metas** → crear barra con período → cargar tareas por día → marcar ejecutadas → PDF del día.
12. **Respaldo** → periódicamente guardar copia JSON; restaurar en otro navegador para "mover" los datos.

---

## 5. Reglas de negocio y cálculos existentes

| ID | Regla (tal como está implementada) | Ubicación |
|---|---|---|
| R-01 | Existencia = Σ cantidades de ingresos − Σ cantidades de salidas del producto (calculada siempre, nunca almacenada). | `stock` L102 |
| R-02 | No se permite registrar o editar un movimiento si la existencia **final** del producto (o del producto anterior al editar) queda negativa. | L149 |
| R-03 | Importe de venta = cantidad × precio; si la forma de pago es "ninguno", importe = 0. | `val` L341 |
| R-04 | Total de compra = cantidad × costo (0 si no hay costo). | `totM` L363 |
| R-05 | Saldo = máx(0, total − pagado); pagado ≤ total (tolerancia 0,004 Bs). | `salM` L365, L146 |
| R-06 | Cancelado ⇔ pagado ≥ total (si total > 0). | L147 |
| R-07 | Crédito exige nombre de cliente. | L141 |
| R-08 | Valor del inventario = existencia × **precio de venta vigente**. | L239 |
| R-09 | Reporte "Pendiente de cobro" = suma del **importe total** de las ventas no canceladas del período. | L169 |
| R-10 | Saldo a rendir = Σ ingresos − Σ gastos del cargo. | `cRows` L408 |
| R-11 | Total de envío = cantidad × precio unitario. | `gt` L469 |
| R-12 | % de ejecución = tareas ejecutadas / tareas totales, redondeado. | `tPct` L590 |
| R-13 | Datos legados: salida sin estado y al contado ⇒ cancelada en la fecha de la venta. | L343–344 |
| R-14 | Precio nuevo de un producto aplica solo a ventas nuevas. | L213 |

---

## 6. Defectos, validaciones insuficientes y riesgos de consistencia

| ID | Severidad | Hallazgo | Evidencia |
|---|---|---|---|
| H-01 | Alta | **"Anular" borra físicamente el movimiento** (`splice`); no queda rastro. Lo mismo ocurre al eliminar registros de cargo, envíos, tareas y conteos. | L119, L421, L482, L600, L653 |
| H-02 | Alta | **Borrar un ingreso no valida el stock**: si ya hubo ventas, el saldo queda negativo. | `delMov` L119 (sin verificación) |
| H-03 | Alta | **Eliminar un producto borra todo su historial**, incluidas ventas y deudas: cambian retroactivamente reportes, CxC y CxP. | `delProd` L118 |
| H-04 | Alta | La validación de stock es sobre el **saldo final**, no a la fecha: una venta con fecha pasada puede dejar el kardex negativo en fechas intermedias. | L149 + `kRows` |
| H-05 | Alta | **Sin historial de pagos**: el abono parcial sobrescribe el acumulado y la única fecha de pago; imposible reconstruir cobros por día. | L147, L348 |
| H-06 | Media | Reporte "Pendiente de cobro" usa el **importe total**, no el saldo: una venta de 1.000 Bs con 900 Bs pagados figura como 1.000 Bs pendientes. Contradice la pestaña "Cobrar". | L169 vs `salM` |
| H-07 | Media | Valoración del inventario con **precio de venta**, no con costo; cambia retroactivamente al editar el precio. | L239 |
| H-08 | Media | Clientes y proveedores en **texto libre** con coincidencia exacta: duplicados por mayúsculas, tildes o errores de tipeo dividen los saldos. | `whoA` L369 |
| H-09 | Media | Cargos a rendir y hojas de envío **cerrados siguen editables**; el número del documento depende de la posición en el arreglo. | L432, L499 |
| H-10 | Media | El contador de ganado **suma conteos de distintas fechas** con el filtro "Todas las fechas". | `koAll` L641 |
| H-11 | Media | Cobrar ventas antiguas solo es posible si están entre los **10 últimos movimientos**; CxC no permite registrar cobros. | L224 |
| H-12 | Media | Cantidades de inventario **enteras** (`parseInt` trunca sin aviso). Los envíos sí aceptan decimales: criterios inconsistentes para productos que se manejan en kg o litros. | L133, L474 |
| H-13 | Media | **Restauración reemplaza todo** con validación superficial; un archivo parcial o de otra versión puede corromper el estado. | L690–693 |
| H-14 | Media | Envíos a predios **no descuentan inventario**; posible doble registro o falta de trazabilidad del origen. | módulo §3.7 |
| H-15 | Baja | Aritmética de dinero en coma flotante de JavaScript (se mitiga con tolerancia 0,004). | L146 |
| H-16 | Baja | Fecha "hoy" según el reloj y zona horaria del dispositivo; ventas pasadas se fechan a las 12:00. | L98, L104 |
| H-17 | Baja | "Contado" puede quedar pendiente y sin cliente. | §3.2 |
| H-18 | Baja | Fila de conteo puede quedar en 0 cabezas con "−", aunque al crear se exige > 0. | L628 vs L647 |
| H-19 | Baja | Tareas fuera del período de su barra no se validan. | `addMeta` L592 |
| H-20 | Estructural | Todo en un archivo, re-render completo, lógica de negocio mezclada con HTML, referencias por índice de arreglo, sin pruebas. Duplicación: cada reporte se implementa **tres veces** (HTML, PDF y texto) con columnas y cálculos repetidos. | todo el archivo |
| H-21 | Estructural | Datos solo en un navegador; límite práctico de `localStorage` (~5 MB); sin multiusuario ni autoría. | L94–95 |

---

## 7. Acoplamientos y funcionalidades incompletas o ambiguas

- **Inventario ↔ ventas ↔ CxC ↔ CxP** están fusionados en un único objeto "movimiento". Es el principal punto a desacoplar: venta (documento comercial), movimiento de inventario (efecto en stock), pago (efecto financiero) y obligación (saldo) son conceptos distintos.
- **Cargo a rendir** y **hojas de envío** comparten el mismo patrón "documento abierto → cerrar → historial" implementado dos veces; conviene un patrón común de "documento con estado".
- **Predios** existen como texto libre en dos módulos (envíos y contador) y como "destino" de venta: no hay una entidad predio única. ❓ ¿El "destino del producto" de una venta es un predio?
- **Productor** (contador) vs **cliente** (ventas) vs **proveedor** (compras): podrían ser la misma persona o empresa. ❓
- Incompletos: ajustes de inventario, motivos de salida, historial de pagos, responsable del cargo, comprobantes, cierre real con conciliación, inventario de animales, exportación CSV.

---

## 8. Qué existe hoy vs. qué solo se propone

| Área | Existe en el prototipo | No existe (propuesta futura) |
|---|---|---|
| Inventario | Productos (nombre, precio), ingresos con proveedor y costo, salidas, kardex en unidades, valor a precio de venta, inventarios separados | Categorías, unidades, código, costo promedio, ajustes con motivo, mínimos configurables, transferencias, kardex valorado |
| Ventas | Venta de un producto por operación, 5 formas de pago, pago parcial acumulado | Venta multi-línea, numeración, anulación con motivo, historial de pagos, clientes como entidad |
| CxC / CxP | Saldos derivados de ventas y compras, agrupados por nombre | Estado de cuenta, vencimientos, antigüedad, obligaciones no ligadas a compras |
| Reportes | Diario, mensual, kardex, inventario general, CxC, CxP, PDF/impresión/texto | Margen, flujo de cobros, consolidado, CSV/Excel, tablero |
| Cargo a rendir | Ingresos/gastos, saldo, cierre simple, historial | Responsable, comprobantes, devoluciones, cierre conciliado y bloqueado |
| Predios | Hojas de envío valoradas, reportes por predio y mes | Entidad predio, productores, origen/destino, documentos de traslado, vínculo con inventario |
| Ganado | Conteos puntuales por productor/categoría/edad | Inventario de animales, movimientos de hacienda, historial de existencias |
| Metas | Barras con período, tareas diarias, % | Responsables, recurrencia, indicadores vinculados a otros módulos |
| Plataforma | Mobile-first, modo oscuro, respaldo JSON manual | Usuarios, roles, base de datos central, PWA, auditoría, multi-dispositivo |
