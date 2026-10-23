# ADR 0003 · Integridad y bitácora en la base de datos

- **Estado:** aceptada (2026-10-23)
- **Contexto:** el prototipo permitía editar y borrar historial sin rastro. El propietario exige: nada de borrado en dinero (solo asientos inversos), borrado lógico con motivo en lo demás, y registro categorizado de toda acción con el valor previo.
- **Decisión:**
  - Las reglas de integridad (stock, saldos, numeración, anulaciones) se implementan en funciones PostgreSQL transaccionales.
  - `app.audit_log`: bitácora de solo inserción (triggers impiden update/delete/truncate) con `action` (create, update, void, deactivate, adjust, transfer, price_change, …), `severity` (normal/critical), módulo, entidad, valores previo/nuevo (solo campos cambiados), motivo, autor, IP y user agent.
  - `app.enable_tracking(tabla, módulo, columnas_críticas)` activa metadatos de autoría y auditoría en cada tabla nueva.
- **Consecuencias:** ninguna escritura (incluida la hecha fuera de la app) omite la bitácora. La lectura de la bitácora se expondrá mediante funciones con control de rol (B2 / EPIC-032).
