# 06 · Riesgos, decisiones y preguntas de negocio

## 1. Preguntas de negocio

No se inventaron reglas para estos puntos: el código no permite resolverlos. Cada pregunta indica el **valor provisional** con el que se puede avanzar si la respuesta se demora.

| ID | Pregunta | Por qué importa | Valor provisional propuesto | Bloquea |
|---|---|---|---|---|
| P-01 | ¿Qué es exactamente una venta **"reproas"**? ¿Quién paga, cuándo, genera deuda, implica devolución de mercadería u otra contraprestación? | El prototipo la trata como una forma de pago más, con línea propia en los reportes, sin ningún dato adicional. | Modalidad configurable que se comporta como hoy: requiere cliente opcional, genera saldo si no se paga, se reporta aparte. | EPIC-014 (no bloquea; se ajusta la configuración) |
| P-02 | En un **intercambio**, ¿qué se recibe a cambio? ¿Debe entrar a inventario? ¿Con qué valor? ¿Qué significa que un intercambio quede "pendiente"? | Hoy no se registra la contrapartida; el inventario recibido no aparece. | Se registra como venta con modalidad "intercambio" y una nota de lo recibido; el ingreso al inventario se hace por separado como compra/ingreso. | EPIC-014 |
| P-03 | ¿En qué casos se usa la forma de pago **"-" (sin forma de pago)**? ¿Consumo propio, regalo, muestra, merma, envío a predio? | Se transformará en salidas no comerciales con motivo. | Motivos: consumo interno, merma, donación/obsequio, envío a predio, otro (con nota). | EPIC-011 |
| P-04 | ¿Una venta **al contado** puede quedar **pendiente**? ¿O todo lo no pagado es crédito? | El prototipo lo permite y la agrupa como "Sin cliente" en CxC. | No: contado = pagado en el acto; si no se paga, se registra como crédito con cliente. | EPIC-014 |
| P-05 | ¿Se necesita registrar **deudas que no son compras** de productos (servicios, alquileres, préstamos, fletes, sueldos)? | Define si EPIC-019 existe. | No en el MVP. | EPIC-019 |
| P-06 | En las **hojas de envío**, ¿lo enviado sale del inventario de la empresa? ¿El valor es un costo cargado al predio, una venta al productor o solo referencia? ¿Quién recibe? | Vínculo envío ↔ inventario (H-14) y sentido del total. | Registro valorado independiente con producto del inventario opcional, sin descontar stock. | EPIC-029 |
| P-07 | ¿Qué significan las edades **C-24, C-25, C-26, C-27**? | Catálogo de edades y posibles reglas por año. | Se importan como clases de edad de texto, sin reglas. | EPIC-030 (no bloquea) |
| P-08 | ¿Se necesita saber **cuántos animales hay hoy** por predio en tiempo real (con nacimientos, muertes, ventas, traslados) o basta con los **conteos periódicos**? | Diferencia entre EPIC-030 (conteo) y EPIC-035 (inventario vivo, XL). | Basta con conteos; "existencia" = último conteo cerrado. | EPIC-035 |
| P-09 | El **"destino del producto"** de una venta, ¿es normalmente un predio? | Permitiría ligar ventas a predios. | Texto libre; se agrega selector de predio opcional en B9. | EPIC-014/028 (no bloquea) |
| P-10 | En el **cargo a rendir**: ¿el responsable es siempre un usuario del sistema? ¿Puede tener varios cargos abiertos? Al cerrar con sobrante o faltante, ¿se devuelve/reembolsa o se pasa al siguiente cargo? | Modelo de cierre y permisos. | Responsable = usuario o tercero; varios abiertos; cierre exige devolución/reembolso o arrastre explícito. | EPIC-026/027 |
| P-11 | ¿Quiénes usarán el sistema, cuántas personas y con qué funciones? ¿Un operador puede registrar compras y anular? | Roles y permisos (D-04, D-09). | 1 propietario, 1–2 admin, 2–5 operadores, consulta opcional. | EPIC-007 |
| P-12 | ¿Qué relación hay entre **productor** y **predio**? ¿Los productores son terceros cuyo ganado está en predios de la empresa, o dueños de los predios? | Modelo de B9. | Relación libre por fila de conteo (como hoy). | EPIC-028 |
| P-13 | Los **inventarios independientes**: ¿son líneas de productos (insumos veterinarios, alimentos) o lugares físicos (almacén central, predio X)? ¿Un mismo producto puede estar en dos? | D-02. | Pueden ser ambos; catálogo compartido con stock por inventario. | EPIC-009/010 |
| P-14 | ¿Hasta cuántos días atrás se puede registrar una operación? ¿Quién puede anular operaciones de días anteriores? | D-08, D-09. | 31 días; operador anula lo propio del día, admin el resto. | EPIC-011/016 |
| P-15 | ¿Se requiere emitir **facturas** (SIN Bolivia) desde el sistema? | Fuera de alcance salvo indicación; impactaría modelo de ventas. | No. | — |
| P-16 | **Volumen** aproximado: productos, ventas por día, clientes, años de historia en el prototipo. | Dimensionar reportes, importación y plan de Supabase. | < 500 productos, < 200 operaciones/día. | EPIC-021/023 (no bloquea) |
| P-17 | ¿Con qué **medios** se cobra y paga (efectivo, transferencia, QR, cheque)? ¿Se necesita cierre de caja por medio? | Campo `method` y reporte de cierre de cobros. | Efectivo, transferencia, QR, otro. | EPIC-015 |
| P-18 | ¿Cómo prefieren **valorar el inventario**: a precio de venta (como hoy), a último costo o a costo promedio? | D-06. | Mostrar precio de venta y último costo. | EPIC-012 (no bloquea) |
| P-19 | ¿Quién será el **dueño** de las cuentas de GitHub, Supabase, Vercel y dominio, y quién paga los planes? | Continuidad y control del negocio sobre sus datos. | Cuentas a nombre de la empresa con el desarrollador como colaborador. | B1 |

## 2. Decisiones de arquitectura y producto

Formato: alternativas → **recomendación** → ventajas / desventajas → impacto.

### D-01 · Una o varias organizaciones
- **A.** Sin concepto de organización (más simple). **B.** `organization_id` en todas las tablas y RLS por membresía, UI de una sola organización. **C.** Multi-organización completa desde el inicio.
- **Recomendación: B.** Ventaja: costo marginal bajo ahora, evita una migración masiva si aparecen otras empresas del grupo o sucursales. Desventaja: una columna y una condición más en cada política. Impacto: B2 y todas las tablas.

### D-02 · Catálogo de productos respecto de los inventarios
- **A.** Cada producto pertenece a un inventario (comportamiento actual). **B.** Catálogo por organización, stock por (inventario, producto); el producto se habilita en los inventarios donde se usa.
- **Recomendación: B**, sujeta a P-13. Ventajas: permite transferencias, depósitos y reportes consolidados sin rediseño; evita duplicar productos. Desventajas: algo más de UI (habilitar producto en inventario). Impacto: EPIC-009/010; el importador crea un producto por nombre normalizado y lo habilita en cada inventario donde aparecía (con revisión manual si los precios difieren).

### D-03 · Hosting
- **A.** Vercel + Supabase Cloud. **B.** Contenedor propio (Railway/Fly/VPS) + Supabase Cloud. **C.** Todo autoalojado (Supabase self-hosted).
- **Recomendación: A** (región Supabase `sa-east-1`). Ventajas: integración nativa con Next.js, previews por PR, mínimo mantenimiento. Desventajas: costo en planes pagos, dependencia de proveedores. C se descarta por carga operativa. Impacto: B1.

### D-04 · Roles del MVP
- **A.** Solo admin/usuario. **B.** owner, admin, operator, viewer. **C.** Permisos granulares configurables.
- **Recomendación: B** (matriz en `05` §3.2); C cuando haya necesidad real. Impacto: EPIC-007.

### D-05 · Clientes, proveedores y productores
- **A.** Tablas separadas. **B.** Tabla única `parties` con indicadores de rol.
- **Recomendación: B.** Ventaja: una misma persona puede ser cliente y productor sin duplicarse; búsqueda y fusión únicas. Desventaja: la ficha debe mostrar secciones según rol. Impacto: EPIC-013, 017, 028.

### D-06 · Valoración del inventario y costo
- **A.** Precio de venta (actual). **B.** Último costo. **C.** Costo promedio ponderado (kardex valorado).
- **Recomendación:** MVP muestra **A y B**; **C** como mejora prioritaria (P1) si el propietario necesita margen exacto. Ventaja: no bloquea el MVP y corrige H-07. Desventaja: B es aproximado. Impacto: EPIC-012, 021.

### D-07 · Capacidad sin conexión
- **A.** Conexión obligatoria. **B.** Offline completo con sincronización. **C.** Offline selectivo para campo.
- **Recomendación: A en el MVP; C después** (EPIC-033) si se demuestra la necesidad. B se descarta: vender sin conexión arriesga stock negativo y conflictos de saldos. Impacto: EPIC-024, 033.

### D-08 · Operaciones con fecha pasada
- **A.** Libre (actual). **B.** Permitido hasta N días con verificación de saldo en fechas posteriores. **C.** Solo fecha de hoy.
- **Recomendación: B** con N = 31 configurable; registro siempre auditado. Impacto: EPIC-011, 014, 017.

### D-09 · Edición vs. anulación
- **A.** Editar libremente (actual). **B.** Documentos registrados inmutables; anular con motivo y volver a registrar ("anular y copiar"). **C.** Editar con auditoría.
- **Recomendación: B.** Ventaja: trazabilidad y reportes estables. Desventaja: corregir un error toma un paso más (mitigado con "anular y copiar"). Datos maestros (nombre de producto, cliente) sí se editan con auditoría. Impacto: B3–B5.

### D-10 · Generación de PDF
- **A.** jsPDF en el navegador (actual). **B.** `@react-pdf/renderer` en servidor. **C.** Solo impresión del navegador ("Guardar como PDF").
- **Recomendación: B + C.** Ventaja: mismo resultado en todos los dispositivos, archivo listo para compartir. Desventaja: tiempo de ejecución en servidor para reportes grandes. Impacto: EPIC-020.

### D-11 · Monedas
- **Recomendación:** solo BOB; `currency` en la organización y formato centralizado. Multi-moneda (USD) solo si P-15/P-17 lo requieren. Impacto: bajo.

### D-12 · Cobros de una venta anulada
- **A.** Se anulan junto con la venta. **B.** Quedan como saldo a favor del cliente.
- **Recomendación: A en el MVP** (simple, coincide con la práctica de devolver el dinero); B como mejora si se usan anticipos. Impacto: EPIC-016.

### D-13 · Orden de los módulos post-MVP
- Cargo a rendir (B8), ganadería (B9) y metas (B10) son independientes. **Recomendación:** B8 → B9 → B10 por impacto financiero; reordenable sin costo técnico.

## 3. Riesgos

| ID | Tipo | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|---|
| R-01 | Funcional | No disponer de un **respaldo real** del prototipo hasta tarde: el importador se diseña a ciegas y aparecen formatos inesperados. | Media | Alto | Solicitarlo en B0 (US-001.3); respaldos sintéticos con todos los formatos legados; importación de ensayo en staging antes de B7. |
| R-02 | Funcional | Diferencias de cifras con el prototipo tras corregir H-06/H-07 generan desconfianza. | Alta | Medio | Informe de conciliación que explica cada diferencia; comunicar los cambios de cálculo antes del corte. |
| R-03 | Funcional | Términos no definidos (reproas, intercambio, C-24) llevan a reglas equivocadas. | Media | Medio | Preguntas P-01/02/07; modalidades y catálogos **configurables** en vez de reglas fijas. |
| R-04 | Funcional | Resistencia al cambio: el equipo sigue en el prototipo (doble registro). | Media | Alto | Fecha de corte por módulo, prototipo en solo lectura, capacitación, flujos más rápidos que los actuales (CE-5). |
| R-05 | Funcional | Ampliación del alcance del MVP (ERP, facturación, contabilidad). | Media | Alto | Exclusiones explícitas (`02` §7); toda nueva idea entra al backlog con prioridad, no al bloque en curso. |
| R-06 | Funcional | Inmutabilidad percibida como rigidez ("antes podía editar"). | Media | Medio | "Anular y copiar" en un paso; edición libre de datos maestros. |
| R-07 | Técnico | Políticas RLS incorrectas exponen o bloquean datos. | Media | Alto | Matriz de pruebas pgTAP obligatoria (DoD), revisión con *advisors* de Supabase. |
| R-08 | Técnico | Condiciones de carrera en stock y numeración con varios usuarios. | Baja | Alto | RPC con bloqueo de filas, pruebas de concurrencia. |
| R-09 | Técnico | Conectividad móvil deficiente en predios o almacén provoca registros duplicados o perdidos. | Alta | Medio | Idempotencia (`client_request_id`), conservación del formulario, indicador de conexión; offline selectivo futuro. |
| R-10 | Técnico | Caché de PWA sirve versiones viejas tras un despliegue. | Media | Medio | Estrategia de actualización con aviso, recursos con hash, migraciones compatibles hacia atrás. |
| R-11 | Técnico | Reportes lentos o que exceden el tiempo de funciones serverless. | Baja | Medio | Agregados en SQL, índices, límites de rango, medición con volumen real. |
| R-12 | Técnico | Fuga de la clave `service_role`. | Baja | Crítico | Solo en secretos de servidor/CI; chequeo automático en el bundle; el importador corre fuera del navegador. |
| R-13 | Operativo | Dependencia de una sola persona técnica; cuentas a nombre personal. | Media | Alto | P-19; documentación, ADRs, accesos compartidos con la empresa. |
| R-14 | Operativo | Pérdida de datos en producción. | Baja | Crítico | Respaldos automáticos + exportación externa + simulacros (EPIC-025/032). |
| R-15 | Costos | Planes pagos de Supabase/Vercel no presupuestados. | Media | Medio | Estimar con volumen (P-16); comenzar en planes gratuitos en staging; definir presupuesto antes de B7. |

## 4. Decisiones y preguntas que bloquean el desarrollo

| Antes de… | Debe estar resuelto | Si no se resuelve |
|---|---|---|
| **B1** (primer bloque) | P-19 (cuentas y facturación), D-03 (hosting), D-01 (organización) | No se puede crear la infraestructura a nombre correcto. D-01 tiene recomendación por defecto. |
| **B2** | D-04 / P-11 (roles) | Se usa la matriz propuesta y se ajusta luego (cambio barato). |
| **B3** | D-02 / P-13 (catálogo), P-03 (motivos de salida), D-08 / P-14 (fechas pasadas) | Se aplican los valores provisionales; D-02 es **el más costoso de cambiar después**. |
| **B4** | P-04 (contado pendiente), D-05 (terceros), D-09 (anulación), D-12, P-17 (medios) | Valores provisionales; P-01/P-02 no bloquean gracias a modalidades configurables. |
| **B5** | Ninguna para EPIC-017/018; P-05 para EPIC-019 | EPIC-019 queda fuera. |
| **B7** | Respaldo real (R-01), fecha de corte, presupuesto de planes (R-15) | No se puede salir a producción con datos. |
| **B8** | P-10 | Valor provisional. |
| **B9** | P-06, P-08, P-12 (P-07 y P-09 no bloquean) | Se entrega la versión "registro valorado + conteos" sin vínculo con inventario. |

## 5. Decisiones que requieren aprobación del propietario (resumen)

1. **Alcance del MVP** = módulo de Inventario completo (inventario, ventas, CxC, compras, CxP, reportes) + importación + PWA online; los otros cuatro módulos siguen en el prototipo hasta B8–B10.
2. **D-02** catálogo compartido con stock por inventario.
3. **D-09** operaciones inmutables: anular con motivo en lugar de editar o borrar.
4. **D-06** valoración mostrada a precio de venta y a último costo.
5. **Corrección de cálculos** H-06 (pendiente de cobro = saldo) y H-10 (no sumar conteos de distintas fechas), aunque las cifras cambien respecto al prototipo.
6. **D-07** conexión obligatoria en el MVP.
7. **D-03** Vercel + Supabase (sa-east-1) y P-19 titularidad de cuentas.
8. Respuestas a **P-01 a P-04, P-11, P-13, P-14, P-17** (o aceptación de los valores provisionales).
