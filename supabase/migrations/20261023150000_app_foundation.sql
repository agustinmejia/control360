-- ════════════════════════════════════════════════════════════════════════════
-- Bloque 1 · Fundamentos de la base de datos
--   · Esquema `app` (funciones internas, no expuesto por la Data API).
--   · Metadatos de autoría (created_*/updated_*) para tablas de negocio.
--   · Bitácora de acciones categorizada e inmutable (docs/roadmap/08 §8).
-- ════════════════════════════════════════════════════════════════════════════

create schema if not exists app;
comment on schema app is 'Funciones y tablas internas de Control360. No se expone por la Data API.';

revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;

-- ── Tipos ────────────────────────────────────────────────────────────────────

create type app.audit_action as enum (
  'create',       -- alta de un registro
  'update',       -- modificación de datos (se guarda el valor previo)
  'void',         -- anulación / asiento inverso
  'deactivate',   -- borrado lógico de datos maestros
  'reactivate',
  'close',        -- cierre de un documento (cargo, hoja, conteo)
  'reopen',
  'transfer',     -- traspaso entre inventarios
  'adjust',       -- ajuste de inventario
  'convert',      -- fraccionamiento / conversión entre presentaciones
  'price_change',
  'role_change',
  'login',
  'import',
  'delete'        -- borrado físico: no debería ocurrir nunca; se registra como crítico
);

create type app.audit_severity as enum ('normal', 'critical');

-- Acciones que siempre se consideran críticas.
create function app.default_severity(p_action app.audit_action)
returns app.audit_severity
language sql
immutable
set search_path = ''
as $$
  select case
    when p_action in ('void', 'adjust', 'transfer', 'convert', 'price_change', 'role_change',
                      'reopen', 'import', 'delete', 'deactivate')
      then 'critical'::app.audit_severity
    else 'normal'::app.audit_severity
  end;
$$;

-- ── Bitácora ─────────────────────────────────────────────────────────────────

create table app.audit_log (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  actor_id       uuid,                                   -- auth.uid(); null = sistema
  action         app.audit_action not null,
  severity       app.audit_severity not null,
  module         text not null check (module ~ '^[a-z_]+$'),
  entity         text not null,                          -- tabla o tipo de documento
  entity_id      text,
  reason         text,
  old_data       jsonb,                                  -- en update: solo campos modificados
  new_data       jsonb,
  changed_fields text[],
  context        jsonb not null default '{}'::jsonb      -- ip, user_agent
);

comment on table app.audit_log is
  'Bitácora de solo inserción de todas las acciones de escritura. Nadie puede modificarla ni borrarla.';

create index audit_log_occurred_at_idx on app.audit_log (occurred_at desc);
create index audit_log_entity_idx on app.audit_log (entity, entity_id, occurred_at desc);
create index audit_log_actor_idx on app.audit_log (actor_id, occurred_at desc);
create index audit_log_critical_idx on app.audit_log (occurred_at desc) where severity = 'critical';

alter table app.audit_log enable row level security;
-- Sin políticas: el acceso es solo mediante funciones `security definer`.
revoke all on table app.audit_log from public, anon, authenticated;

create function app.audit_log_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La bitácora de acciones es inmutable (operación % no permitida)', tg_op
    using errcode = 'P0001', hint = 'FORBIDDEN';
end;
$$;

create trigger audit_log_no_update_delete
  before update or delete on app.audit_log
  for each row execute function app.audit_log_immutable();

create trigger audit_log_no_truncate
  before truncate on app.audit_log
  for each statement execute function app.audit_log_immutable();

-- Contexto de la solicitud HTTP que PostgREST expone en `request.headers`.
create function app.request_context()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_headers jsonb;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_headers := null;
  end;
  if v_headers is null then
    return '{}'::jsonb;
  end if;
  return jsonb_strip_nulls(jsonb_build_object(
    'ip', nullif(trim(split_part(coalesce(v_headers ->> 'x-forwarded-for',
                                          v_headers ->> 'x-real-ip', ''), ',', 1)), ''),
    'user_agent', left(v_headers ->> 'user-agent', 300)
  ));
end;
$$;

/*
 * Registra una acción en la bitácora. La usan los triggers y las funciones de negocio.
 * En `update`, guarda solo los campos que cambiaron (valor previo y nuevo).
 * El motivo puede pasarse explícitamente o con `set local app.reason = '...'`.
 */
create function app.log_action(
  p_action    app.audit_action,
  p_module    text,
  p_entity    text,
  p_entity_id text default null,
  p_old       jsonb default null,
  p_new       jsonb default null,
  p_reason    text default null,
  p_severity  app.audit_severity default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed text[];
  v_old     jsonb := p_old;
  v_new     jsonb := p_new;
  v_id      bigint;
begin
  if p_old is not null and p_new is not null then
    select coalesce(array_agg(n.key order by n.key), '{}')
      into v_changed
      from jsonb_each(p_new) n
     where p_old -> n.key is distinct from n.value;
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_old
      from jsonb_each(p_old) where key = any (v_changed);
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_new
      from jsonb_each(p_new) where key = any (v_changed);
  end if;

  insert into app.audit_log
    (actor_id, action, severity, module, entity, entity_id, reason,
     old_data, new_data, changed_fields, context)
  values
    (auth.uid(), p_action, coalesce(p_severity, app.default_severity(p_action)), p_module,
     p_entity, p_entity_id,
     coalesce(p_reason, nullif(current_setting('app.reason', true), '')),
     v_old, v_new, v_changed, app.request_context())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function app.log_action from public, anon, authenticated;

/*
 * Trigger genérico de auditoría para tablas de negocio.
 *   tg_argv[0] = módulo (inventory, sales, …)
 *   tg_argv[1] = columnas separadas por coma cuyo cambio vuelve crítica la modificación.
 *                Si cambia `sale_price`, la acción se registra como 'price_change'.
 */
create function app.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_module   text := coalesce(tg_argv[0], 'general');
  v_critical text[] := case when tg_nargs > 1 and tg_argv[1] <> ''
                            then string_to_array(tg_argv[1], ',') else '{}' end;
  v_old      jsonb;
  v_new      jsonb;
  v_action   app.audit_action;
  v_severity app.audit_severity;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_action := 'create';
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    if v_old - 'updated_at' - 'updated_by' = v_new - 'updated_at' - 'updated_by' then
      return new;  -- sin cambios reales
    end if;
    v_action := 'update';
    if exists (select 1 from unnest(v_critical) c where v_old -> c is distinct from v_new -> c) then
      v_severity := 'critical';
      if v_old -> 'sale_price' is distinct from v_new -> 'sale_price' then
        v_action := 'price_change';
      end if;
    end if;
  else
    v_old := to_jsonb(old);
    v_action := 'delete';
  end if;

  perform app.log_action(v_action, v_module, tg_table_schema || '.' || tg_table_name,
                         coalesce(v_new ->> 'id', v_old ->> 'id'), v_old, v_new, null, v_severity);

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- ── Metadatos de autoría ─────────────────────────────────────────────────────

/*
 * Convención: toda tabla de negocio tiene created_at, created_by, updated_at, updated_by.
 * Este trigger los completa y evita que el cliente los falsifique.
 */
create function app.set_row_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.created_by := auth.uid();
    new.updated_at := new.created_at;
    new.updated_by := new.created_by;
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

/*
 * Activa metadatos y auditoría en una tabla con una sola llamada desde una migración:
 *   select app.enable_tracking('public.products', 'inventory', 'sale_price');
 */
create function app.enable_tracking(
  p_table            regclass,
  p_module           text,
  p_critical_columns text default ''
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  execute format(
    'create trigger set_row_metadata before insert or update on %s
       for each row execute function app.set_row_metadata()', p_table);
  execute format(
    'create trigger audit_row_change after insert or update or delete on %s
       for each row execute function app.audit_row_change(%L, %L)',
    p_table, p_module, p_critical_columns);
end;
$$;

revoke all on function app.enable_tracking from public, anon, authenticated;
