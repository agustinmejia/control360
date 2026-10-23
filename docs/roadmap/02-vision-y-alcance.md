# 02 · Visión y alcance

## 1. Problema que resuelve

Grupo Pecuario lleva hoy su operación diaria (existencias, ventas, cobros, deudas con proveedores, fondos entregados a personal, envíos a predios, conteos de ganado y metas) en una aplicación que vive **en un solo navegador**. Esto provoca:

1. **Información aislada y frágil**: los datos dependen de un dispositivo y de respaldos manuales; un borrado del navegador los elimina.
2. **Sin trabajo en equipo**: no hay usuarios ni permisos; no se sabe quién registró o cambió algo.
3. **Historial modificable sin rastro**: anular o editar borra o reescribe operaciones; eliminar un producto elimina sus ventas y deudas (`01-analisis-prototipo.md`, H-01 a H-05).
4. **Cifras que pueden no cuadrar**: pendiente de cobro calculado sobre el total, inventario valorado a precio de venta, clientes duplicados por escritura, conteos sumados entre fechas (H-06 a H-10).
5. **Difícil de mantener y ampliar**: todo en un archivo con lógica repetida para pantalla, PDF y texto (H-20).

## 2. Visión del producto

> Una aplicación web única, segura y fácil de usar desde el teléfono, donde el equipo de Grupo Pecuario registra cada operación una sola vez y obtiene cifras confiables de existencias, ventas, cobros, deudas, fondos y ganado, con historial completo de quién hizo qué y cuándo.

Principios:

- **Registro único, efectos consistentes**: una venta actualiza stock y saldo del cliente en la misma transacción.
- **Nada se borra en silencio**: las correcciones se hacen con anulaciones o contramovimientos trazables.
- **Móvil primero**: las tareas diarias (vender, cobrar, contar) se hacen en el teléfono con pocos toques.
- **Crecer por módulos**: cada módulo se entrega y valida por separado sobre una base común.
- **Simple antes que completo**: no es un ERP ni un sistema contable; no se incorporan contabilidad de doble partida, facturación fiscal ni nómina salvo decisión explícita.

## 3. Usuarios objetivo

Los perfiles se deducen del uso del prototipo; los nombres de cargos son propuestos y deben confirmarse (pregunta P-11).

| Perfil | Necesidades | Módulos |
|---|---|---|
| **Propietario / gerente** | Ver ventas, saldos, deudas y existencias desde cualquier lugar; confiar en las cifras; controlar quién hace qué. | Todos (lectura), configuración, usuarios |
| **Administrador / encargado de oficina** | Registrar compras y pagos, controlar cuentas por cobrar y pagar, emitir reportes y PDF, corregir errores con trazabilidad. | Inventario, ventas, CxC, CxP, reportes, cargo a rendir |
| **Vendedor / encargado de almacén** | Registrar ventas, ingresos y cobros rápido desde el teléfono; ver existencias. | Ventas, cobros, movimientos, existencias |
| **Responsable de fondos** | Saber cuánto se le entregó, cargar gastos y rendir. | Cargo a rendir (solo sus fondos) |
| **Personal de campo / capataz** | Contar ganado y registrar envíos en el predio, a veces con mala señal. | Contador de ganado, envíos a predios, metas |
| **Contador externo** (eventual) | Consultar y exportar reportes. | Reportes (solo lectura) |

## 4. Objetivos

### Funcionales
- O-F1. Inventario con catálogo, entradas, salidas, ajustes y kardex trazables por inventario.
- O-F2. Ventas multi-producto con modalidades de pago y cobros parciales con historial.
- O-F3. Cuentas por cobrar y por pagar con estado de cuenta por cliente y proveedor.
- O-F4. Reportes diarios y mensuales equivalentes o superiores a los actuales, en PDF e impresión.
- O-F5. Cargo a rendir con responsable, comprobantes y cierre conciliado (post-MVP).
- O-F6. Envíos a predios y conteos de ganado con entidades predio/productor (post-MVP).
- O-F7. Metas y tareas por período (post-MVP).

### Operativos y técnicos
- O-T1. Datos centralizados en PostgreSQL (Supabase), accesibles desde varios dispositivos.
- O-T2. Usuarios, roles y permisos aplicados también en la base de datos (RLS).
- O-T3. Operaciones críticas atómicas ejecutadas en el servidor (funciones de PostgreSQL), no en el navegador.
- O-T4. Auditoría de operaciones sensibles.
- O-T5. PWA instalable, con conexión obligatoria en el MVP.
- O-T6. Migración de los datos actuales sin pérdida y verificable.
- O-T7. Pruebas automáticas de flujos críticos y de permisos; despliegue continuo.

## 5. Clasificación de funcionalidades

Leyenda: **E** = Existente en el prototipo · **MVP** = Necesaria para el MVP · **MP** = Mejora prioritaria (post-MVP inmediato) · **F** = Futura · **PD** = Pendiente de definición.

| Funcionalidad | E | Clasificación | Bloque |
|---|:-:|---|---|
| Login, perfiles, roles básicos, RLS | | MVP | B2 |
| Organización (negocio) con nombre y datos para reportes | ✅ | MVP | B2–B3 |
| Inventarios independientes | ✅ | MVP | B3 |
| Catálogo de productos (nombre, precio de venta) | ✅ | MVP | B3 |
| Categorías y unidad de medida por producto | | MVP (simples) | B3 |
| Cantidades decimales por unidad | | MVP | B3 |
| Saldo inicial diferenciado de compras | | MVP | B3 |
| Entradas por compra con proveedor y costo | ✅ | MVP | B3/B5 |
| Salidas no comerciales con motivo (consumo, merma, donación) | | MVP (reemplaza "ninguno") · ver P-03 | B3 |
| Ajustes de inventario con motivo | | MVP | B3 |
| Anulación por contramovimiento (sin borrado) | | MVP | B3–B5 |
| Kardex en unidades | ✅ | MVP | B3 |
| Kardex valorado / costo promedio | | MP | B3 (ext.) |
| Valoración del inventario | ✅ | MVP (a precio de venta y a último costo) · método definitivo PD (D-06) | B3 |
| Mínimo de stock configurable | | MP | B3 |
| Transferencias entre inventarios | | F | B11 |
| Clientes como entidad (con búsqueda y alta rápida) | | MVP | B4 |
| Venta multi-línea con número | | MVP | B4 |
| Contado y crédito | ✅ | MVP | B4 |
| Intercambio | ✅ | MVP (como modalidad registrada) · contrapartida PD (P-02) | B4 |
| Reproas | ✅ | **PD** (P-01); se mantiene como modalidad configurable mientras tanto | B4 |
| Pagos parciales con historial | parcial | MVP | B4 |
| Estado de cuenta del cliente | | MVP | B4 |
| Vencimientos y antigüedad de saldos | | MP | B4 (ext.) |
| Proveedores como entidad | | MVP | B5 |
| CxP por compras con pagos parciales | ✅ | MVP | B5 |
| Obligaciones no ligadas a compras (gastos, servicios, préstamos) | | MP · PD (P-05) | B5 (ext.) |
| Reporte diario y mensual de ventas | ✅ | MVP | B6 |
| Reporte de cobros por fecha de pago (cierre de caja) | | MVP | B6 |
| Reporte de inventario, kardex, CxC, CxP | ✅ | MVP | B6 |
| PDF e impresión | ✅ | MVP | B6 |
| Compartir texto por WhatsApp | ✅ | MP | B6 |
| Exportación CSV | | MP | B6 |
| Tablero con indicadores | | MP | B6 (ext.) / B11 |
| Importación del respaldo JSON del prototipo (inventario y ventas) | | MVP | B7 |
| PWA instalable con conexión obligatoria | | MVP | B7 |
| Auditoría de operaciones | | MVP (registro); pantalla de consulta MP | B2/B11 |
| Cargo a rendir con responsable y cierre conciliado | ✅ parcial | MP (primer módulo post-MVP) | B8 |
| Comprobantes adjuntos (fotos) en gastos | | MP | B8 |
| Predios y productores como entidades | | MP | B9 |
| Hojas de envío a predios | ✅ | MP | B9 |
| Vínculo envío ↔ inventario | | PD (P-06) | B9 |
| Contador de ganado (conteos puntuales) | ✅ | MP | B9 |
| Inventario vivo de animales (altas/bajas) | | F · PD (P-08) | B11+ |
| Movimientos/despachos de ganado con documentos de traslado | | F · PD | B11+ |
| Metas y tareas | ✅ | MP (módulo complementario) | B10 |
| Modo sin conexión para conteo de ganado | | F (evaluar tras uso real) | B11 |
| Varias organizaciones (multi-empresa) | | F (el esquema queda preparado) | B11 |
| Facturación fiscal, contabilidad, nómina | | Fuera de alcance | — |

## 6. Alcance del MVP

**El MVP reemplaza el módulo "Inventario" completo del prototipo** (Productos, Movimiento, Kardex, Cobrar, Pagar, Día, Mes) con datos centralizados, usuarios y trazabilidad, e importa los datos existentes de ese módulo.

Incluye (bloques B1–B7 de `03-roadmap.md`):

1. Base técnica, despliegue y PWA instalable (online).
2. Autenticación, una organización, roles *propietario, administrador, operador, consulta*, RLS.
3. Inventarios, productos, categorías, unidades, ingresos, salidas no comerciales, ajustes, anulaciones, kardex y existencias valoradas.
4. Clientes, ventas multi-línea con contado/crédito/intercambio/reproas, cobros parciales con historial, estado de cuenta, CxC.
5. Proveedores, compras (ingresos valorados), pagos parciales, CxP.
6. Reportes diario y mensual de ventas, cierre de cobros, inventario, kardex, CxC y CxP con PDF e impresión.
7. Importador del respaldo JSON (módulo de inventario) con verificación de totales.
8. Auditoría básica (quién/cuándo en cada registro + bitácora de anulaciones y cambios sensibles).

**Coexistencia:** durante el MVP los módulos Cargo a rendir, Predios, Contador y Metas **siguen usándose en el prototipo**. Esto es posible porque no comparten datos con el inventario (salvo las sugerencias de nombres de predio). Se recomienda seguir generando respaldos JSON del prototipo hasta migrar cada módulo.

## 7. Exclusiones explícitas del MVP

- Cargo a rendir, predios/envíos, contador de ganado y metas (entran en B8–B10).
- Funcionamiento sin conexión y sincronización.
- Varias organizaciones en la interfaz (el esquema sí lleva `organization_id`).
- Costo promedio ponderado y kardex valorado (MP).
- Vencimientos, intereses, límites de crédito.
- Obligaciones de pago no ligadas a compras.
- Facturación electrónica, impuestos, contabilidad, integración bancaria.
- Adjuntos y Storage (se introducen con comprobantes en B8).
- Notificaciones push, correos automáticos, integraciones con WhatsApp API.

## 8. Criterios de éxito

| ID | Criterio | Cómo se mide |
|---|---|---|
| CE-1 | Los datos importados del prototipo cuadran | Para cada producto, existencia y totales de CxC/CxP iguales entre el respaldo y la nueva app (informe de conciliación del importador = 0 diferencias no explicadas). |
| CE-2 | Ninguna operación se pierde ni se reescribe en silencio | No existen rutas de borrado físico para ventas, movimientos ni pagos; pruebas automáticas lo verifican. |
| CE-3 | Stock nunca negativo (salvo configuración explícita) | Restricción en base de datos + prueba de concurrencia. |
| CE-4 | Permisos efectivos | Suite de pruebas RLS: un usuario sin rol no lee ni escribe datos de la organización. |
| CE-5 | Uso móvil fluido | Una venta de 1 producto al contado se registra en ≤ 30 s en un teléfono de gama media; pantallas usables a 360 px. |
| CE-6 | Reportes equivalentes | Cada reporte del prototipo tiene equivalente con las mismas cifras (corrigiendo H-06 de forma documentada). |
| CE-7 | Instalable | La app se instala en Android (Chrome) e iOS (Safari, "Añadir a inicio") y avisa cuando hay una versión nueva. |
| CE-8 | Adopción | El equipo deja de registrar inventario y ventas en el prototipo tras el período de convivencia acordado. |

## 9. Dependencias entre módulos (resumen)

```
Fundamentos (B1) ─► Acceso y organización (B2) ─► Inventario (B3) ─┬─► Ventas/CxC (B4) ─┐
                                                                    └─► Compras/CxP (B5) ┼─► Reportes (B6) ─► Migración + PWA (B7) = MVP
                                       B2 ─► Cargo a rendir (B8)  (no depende de B3–B5)
                                       B2 ─► Predios y ganado (B9) (vínculo opcional con B3)
                                       B2 ─► Metas (B10)
                                       Todo ─► Consolidación (B11, continuo)
```

Detalle en `03-roadmap.md`.
