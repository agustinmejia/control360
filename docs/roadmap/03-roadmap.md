# 03 · Roadmap por bloques

> **Avance (2026-10-23):** B0 ✅ · B1 ✅ · B2 ✅ · B3 ✅ (probados contra Supabase local; falta conectar el proyecto remoto, ver `docs/despliegue.md`). Siguiente: **B4 · Ventas y cuentas por cobrar**.

> Estimaciones **relativas y preliminares** (XS < S < M < L < XL). No se dan fechas: dependen de disponibilidad del equipo y de las decisiones pendientes.
> Prioridades: **P0** imprescindible para el MVP · **P1** primera ola post-MVP · **P2** posterior · **P3** futuro/exploratorio.

## 1. Orden final y justificación

La hipótesis inicial se reorganizó así:

| # | Bloque | Cambio respecto a la hipótesis | Motivo |
|---|---|---|---|
| B0 | Análisis y definición funcional | — | Este paquete de documentos. |
| B1 | Fundamentos técnicos | Incluye un manifiesto PWA mínimo. | Es barato y evita retrabajo del *layout*. |
| B2 | Autenticación, organización y acceso | Incluye **auditoría y numeración** (infraestructura transversal). | Todos los módulos los necesitan desde su primera tabla. |
| B3 | Inventario | — | Base de ventas y compras: sin stock confiable no hay venta confiable. |
| B4 | Ventas y cuentas por cobrar | — | Mayor valor diario para el negocio. |
| B5 | Compras y cuentas por pagar | Renombrado: en el prototipo la CxP **nace de las compras**. | Se mantiene acotado para no convertirlo en ERP. |
| B6 | Reportes y documentos (MVP) | **Adelantado** (antes era B8). | Los reportes diario/mensual son parte de la operación actual; sin ellos el MVP no reemplaza al prototipo. |
| B7 | Salida a producción: migración + PWA | **Nuevo bloque**, fusiona la migración de datos con el antiguo B10 (PWA). | El MVP solo es útil si trae los datos actuales y se instala en los teléfonos. |
| B8 | Cargo a rendir | Después del MVP. | Independiente del inventario; puede seguir en el prototipo mientras tanto. |
| B9 | Operaciones ganaderas | Después del MVP. | Requiere aclarar varias preguntas de negocio (P-06 a P-09); el prototipo cubre el uso actual. |
| B10 | Metas y productividad | Último módulo funcional. | Complementario, sin dependencias de datos. |
| B11 | Consolidación y crecimiento | **Continuo** + épicas futuras. | Observabilidad, seguridad y rendimiento se trabajan en cada bloque; aquí se profundizan. |

**Hitos:**

- **H1 — Base lista** (fin de B2): se puede iniciar sesión en staging con roles y RLS probados.
- **H2 — MVP** (fin de B7): inventario, ventas, cobros, compras, pagos y reportes en producción con datos importados.
- **H3 — Finanzas operativas** (fin de B8).
- **H4 — Campo** (fin de B9).
- **H5 — Paridad total con el prototipo** (fin de B10): el prototipo puede retirarse.

B8, B9 y B10 son **independientes entre sí**: su orden puede cambiarse según la prioridad del negocio sin impacto técnico (decisión D-13).

## 2. Mapa de dependencias

```
EPIC-001 ─► EPIC-002 ─► EPIC-003
                │ └───► EPIC-004 ─► EPIC-005
                ▼
        EPIC-006 ─► EPIC-007 ─► EPIC-008
                                  │
       ┌──────────────────────────┼──────────────────────────────────────┐
       ▼                          ▼                                      ▼
EPIC-009 ─► EPIC-010 ─► EPIC-011 ─► EPIC-012          EPIC-026 ─► EPIC-027 (B8)
                │           │                          EPIC-028 ─► EPIC-029, EPIC-030 (B9)
                ▼           ▼                          EPIC-031 (B10)
           EPIC-013 ─► EPIC-014 ─► EPIC-015 ─► EPIC-016
                └────► EPIC-017 ─► EPIC-018 (─► EPIC-019 P1)
                                     │
                         EPIC-020 ─► EPIC-021 (─► EPIC-022 P1)
                                     │
                   EPIC-023, EPIC-024 ─► EPIC-025  ══ MVP ══
```

## 3. Bloques

### B0 · Análisis y definición funcional
- **Objetivo:** entender el prototipo, fijar alcance del MVP y decisiones.
- **Épicas:** EPIC-001 Auditoría y definición funcional (P0, S).
- **Condición de salida:** documentos 01–07 revisados por el propietario; decisiones **bloqueantes de B1–B3** respondidas (ver `06`, sección 4); preguntas de negocio del MVP con respuesta o con valor provisional aceptado.

### B1 · Fundamentos técnicos
- **Objetivo:** un esqueleto desplegado, con calidad automatizada, sobre el que se construyen todos los módulos.
- **Épicas:**
  - EPIC-002 Proyecto base y convenciones (P0, S)
  - EPIC-003 Sistema de diseño y *shell* responsive (P0, M)
  - EPIC-004 Supabase: entornos, migraciones y tipos (P0, S)
  - EPIC-005 Calidad y entrega continua (P0, M)
- **Condición de salida:** URL de staging con *shell* navegable en móvil y escritorio; CI verde (lint, typecheck, unit, pgTAP vacío, build); migración inicial aplicada en staging desde CI; guía de contribución escrita.

### B2 · Autenticación, organización y acceso
- **Objetivo:** usuarios reales con roles y datos aislados por organización.
- **Épicas:**
  - EPIC-006 Autenticación y perfiles (P0, S)
  - EPIC-007 Organización, membresías, roles y RLS (P0, M)
  - EPIC-008 Auditoría y numeración de documentos (P0, S)
- **Condición de salida:** H1. Propietario invita a un usuario, este ingresa y ve solo lo que su rol permite; suite RLS verde; toda escritura queda con autor.

### B3 · Inventario
- **Objetivo:** paridad con Productos/Movimiento/Kardex del prototipo, corrigiendo H-01 a H-04, H-07 y H-12.
- **Épicas:**
  - EPIC-009 Inventarios y datos del negocio (P0, S)
  - EPIC-010 Catálogo: productos, categorías y unidades (P0, M)
  - EPIC-011 Movimientos de inventario no comerciales y ajustes (P0, M)
  - EPIC-012 Kardex y existencias valoradas (P0, M)
- **Condición de salida:** se puede crear un inventario, cargar productos con saldo inicial, registrar consumos/mermas/ajustes, anular por contramovimiento y consultar kardex y existencias; ninguna ruta permite stock negativo ni borrar historial.

### B4 · Ventas y cuentas por cobrar
- **Objetivo:** registrar ventas y cobros con historial completo; CxC confiable.
- **Épicas:**
  - EPIC-013 Terceros: clientes (P0, S)
  - EPIC-014 Registro de ventas (P0, L)
  - EPIC-015 Cobros y cuentas por cobrar (P0, L)
  - EPIC-016 Anulación de ventas y cobros (P0, M)
- **Condición de salida:** venta multi-línea al contado, crédito, intercambio y reproas; cobros parciales desde CxC; estado de cuenta por cliente; anulación con motivo que repone stock y recalcula saldos; e2e de los flujos críticos verdes.

### B5 · Compras y cuentas por pagar
- **Objetivo:** ingresos valorados con proveedor y su deuda.
- **Épicas:**
  - EPIC-017 Proveedores y compras (P0, M)
  - EPIC-018 Pagos y cuentas por pagar (P0, M)
  - EPIC-019 Obligaciones no ligadas a compras (P1, M, **pendiente de definición P-05**)
- **Condición de salida:** compra con varias líneas y costo; pago parcial; estado de cuenta por proveedor; anulación de compra validando stock.

### B6 · Reportes y documentos (MVP)
- **Objetivo:** reemplazar los reportes del prototipo con cifras correctas y un solo motor.
- **Épicas:**
  - EPIC-020 Motor de reportes, impresión y PDF (P0, M)
  - EPIC-021 Reportes operativos del MVP (P0, L)
  - EPIC-022 Tablero de inicio e indicadores (P1, M)
- **Condición de salida:** reportes diario y mensual de ventas, cierre de cobros, inventario general, kardex, CxC y CxP disponibles en pantalla, impresión y PDF, con cifras verificadas contra casos de prueba.

### B7 · Salida a producción (migración + PWA)
- **Objetivo:** llevar el MVP a manos del equipo con sus datos.
- **Épicas:**
  - EPIC-023 Importador del respaldo del prototipo (P0, L)
  - EPIC-024 PWA instalable y experiencia móvil (P0, S)
  - EPIC-025 Puesta en producción y convivencia (P0, M)
- **Condición de salida:** H2. Producción con datos importados y conciliados; app instalada en los teléfonos del equipo; respaldo y restauración probados; plan de convivencia comunicado.

### B8 · Cargo a rendir
- **Épicas:**
  - EPIC-026 Fondos a rendir y registro de gastos (P1, M)
  - EPIC-027 Rendición, cierre conciliado y reportes (P1, M)
- **Condición de salida:** H3. Cargos con responsable, gastos con comprobante, devoluciones y cierre que cuadra a cero; cargos cerrados inmutables; datos del prototipo importados.

### B9 · Operaciones ganaderas
- **Épicas:**
  - EPIC-028 Predios y productores (P1, S)
  - EPIC-029 Hojas de envío a predios (P1, M)
  - EPIC-030 Conteos de ganado (P1, M)
- **Condición de salida:** H4. Envíos y conteos registrados contra predios y productores únicos; reportes por predio y mes; "existencia por último conteo" sin doble suma; datos importados.

### B10 · Metas y productividad
- **Épicas:** EPIC-031 Metas y tareas (P2, S).
- **Condición de salida:** H5. Barras de metas con período y tareas con responsable; % de cumplimiento por día y período; datos importados; prototipo retirable.

### B11 · Consolidación y crecimiento (continuo)
- **Épicas:**
  - EPIC-032 Observabilidad, seguridad, rendimiento y recuperación (P1, M — se inicia en B7 y continúa)
  - EPIC-033 Modo sin conexión selectivo para campo (P3, L)
  - EPIC-034 Crecimiento: multi-organización, transferencias entre inventarios, integraciones (P3, XL)
  - EPIC-035 Inventario vivo de ganado (P3, XL, **pendiente de definición P-08**)
- **Condición de salida:** por épica; se revisa trimestralmente.

## 4. Resumen de épicas

| ID | Épica | Bloque | Prioridad | Esfuerzo | Depende de |
|---|---|---|---|---|---|
| EPIC-001 | Auditoría y definición funcional | B0 | P0 | S | — |
| EPIC-002 | Proyecto base y convenciones | B1 | P0 | S | 001 |
| EPIC-003 | Sistema de diseño y shell responsive | B1 | P0 | M | 002 |
| EPIC-004 | Supabase: entornos, migraciones y tipos | B1 | P0 | S | 002 |
| EPIC-005 | Calidad y entrega continua | B1 | P0 | M | 002, 004 |
| EPIC-006 | Autenticación y perfiles | B2 | P0 | S | 003, 004 |
| EPIC-007 | Organización, membresías, roles y RLS | B2 | P0 | M | 006 |
| EPIC-008 | Auditoría y numeración de documentos | B2 | P0 | S | 007 |
| EPIC-009 | Inventarios y datos del negocio | B3 | P0 | S | 007 |
| EPIC-010 | Catálogo: productos, categorías, unidades | B3 | P0 | M | 009 |
| EPIC-011 | Movimientos no comerciales y ajustes | B3 | P0 | M | 008, 010 |
| EPIC-012 | Kardex y existencias valoradas | B3 | P0 | M | 011 |
| EPIC-013 | Terceros: clientes | B4 | P0 | S | 007 |
| EPIC-014 | Registro de ventas | B4 | P0 | L | 011, 013 |
| EPIC-015 | Cobros y cuentas por cobrar | B4 | P0 | L | 014 |
| EPIC-016 | Anulación de ventas y cobros | B4 | P0 | M | 015 |
| EPIC-017 | Proveedores y compras | B5 | P0 | M | 011, 013 |
| EPIC-018 | Pagos y cuentas por pagar | B5 | P0 | M | 017 |
| EPIC-019 | Obligaciones no ligadas a compras | B5 | P1 | M | 018, P-05 |
| EPIC-020 | Motor de reportes, impresión y PDF | B6 | P0 | M | 003 |
| EPIC-021 | Reportes operativos MVP | B6 | P0 | L | 012, 016, 018, 020 |
| EPIC-022 | Tablero de inicio e indicadores | B6 | P1 | M | 021 |
| EPIC-023 | Importador del respaldo del prototipo | B7 | P0 | L | 012, 016, 018 |
| EPIC-024 | PWA instalable y experiencia móvil | B7 | P0 | S | 003 |
| EPIC-025 | Puesta en producción y convivencia | B7 | P0 | M | 021, 023, 024 |
| EPIC-026 | Fondos a rendir y registro de gastos | B8 | P1 | M | 008 |
| EPIC-027 | Rendición, cierre conciliado y reportes | B8 | P1 | M | 026, 020 |
| EPIC-028 | Predios y productores | B9 | P1 | S | 013 |
| EPIC-029 | Hojas de envío a predios | B9 | P1 | M | 028, 020 |
| EPIC-030 | Conteos de ganado | B9 | P1 | M | 028, 020 |
| EPIC-031 | Metas y tareas | B10 | P2 | S | 008, 020 |
| EPIC-032 | Observabilidad, seguridad, rendimiento, recuperación | B11 | P1 | M | 025 |
| EPIC-033 | Modo sin conexión selectivo | B11 | P3 | L | 030 |
| EPIC-034 | Crecimiento (multi-org, transferencias, integraciones) | B11 | P3 | XL | 025 |
| EPIC-035 | Inventario vivo de ganado | B11 | P3 | XL | 030, P-08 |

**Esfuerzo relativo por hito** (conteo de épicas P0, orientativo): H1 = 3 M + 4 S · H2 (adicional a H1) = 4 L + 8 M + 3 S · H3–H5 = 4 M + 2 S. El MVP es, con diferencia, el tramo más grande: por eso se insiste en no ampliar su alcance.

## 5. Cómo se valida cada entrega

Cada épica se cierra con:

1. Demostración en **staging** con datos de prueba ante el propietario del producto.
2. Criterios de aceptación de sus historias verificados (checklist en la PR o en el tablero).
3. Pruebas automáticas verdes en CI (incluidas RLS y RPC de la épica).
4. Revisión en móvil (360 px) y escritorio.
5. Documentación actualizada (decisiones tomadas, cambios de esquema).

El *Definition of Done* común está en `04-epicas-e-historias.md`, sección 0.
