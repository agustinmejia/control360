-- ════════════════════════════════════════════════════════════════════════════
-- Bloque 3 (2/2) · Documentos de inventario, kardex y existencias.
--
-- Reglas (docs/roadmap/08-decisiones-del-nucleo.md):
--   · Todo cambio de stock nace de un DOCUMENTO (saldo inicial, entrada, salida,
--     ajuste, traspaso, fraccionamiento) y genera MOVIMIENTOS inmutables (kardex).
--   · El stock nunca es negativo: ni hoy, ni en ninguna fecha posterior a una
--     operación registrada con fecha pasada.
--   · Anular = documento inverso con fecha del día de la anulación; el original
--     queda marcado como anulado y enlazado. Nada se edita ni se borra.
--   · Las escrituras solo ocurren mediante las funciones `inv_post_*` / `inv_void_document`.
-- ════════════════════════════════════════════════════════════════════════════

create type public.inv_document_type as enum
  ('opening', 'entry', 'exit', 'adjustment', 'transfer', 'conversion', 'reversal');
comment on type public.inv_document_type is
  'opening: saldo inicial · entry: entrada · exit: salida no comercial · adjustment: ajuste por conteo · '
  'transfer: traspaso · conversion: fraccionamiento · reversal: documento inverso (anulación)';

-- ── Motivos ──────────────────────────────────────────────────────────────────

create table public.movement_reasons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null check (code ~ '^[a-z0-9_]{2,40}$'),
  name          text not null check (char_length(trim(name)) between 2 and 60),
  document_type public.inv_document_type not null check (document_type in ('entry', 'exit', 'adjustment')),
  is_active     boolean not null default true,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid
);
create unique index movement_reasons_code_key on public.movement_reasons (code);
create unique index movement_reasons_name_key on public.movement_reasons (document_type, lower(trim(name)));

insert into public.movement_reasons (code, name, document_type, created_at, updated_at) values
  ('consumo_interno',   'Consumo interno',          'exit',       now(), now()),
  ('merma',             'Merma o pérdida',          'exit',       now(), now()),
  ('donacion',          'Donación u obsequio',      'exit',       now(), now()),
  ('envio_predio',      'Envío a predio',           'exit',       now(), now()),
  ('vencimiento',       'Vencimiento',              'exit',       now(), now()),
  ('otra_salida',       'Otra salida',              'exit',       now(), now()),
  ('devolucion',        'Devolución',               'entry',      now(), now()),
  ('donacion_recibida', 'Donación recibida',        'entry',      now(), now()),
  ('otro_ingreso',      'Otro ingreso',             'entry',      now(), now()),
  ('conteo_fisico',     'Ajuste por conteo físico', 'adjustment', now(), now()),
  ('correccion',        'Corrección de registro',   'adjustment', now(), now());

-- ── Documentos ───────────────────────────────────────────────────────────────

create table public.inventory_documents (
  id                   uuid primary key default gen_random_uuid(),
  number               bigint not null,
  document_type        public.inv_document_type not null,
  document_date        date not null,
  inventory_id         uuid not null references public.inventories (id),
  target_inventory_id  uuid references public.inventories (id),
  reason_id            uuid references public.movement_reasons (id),
  notes                text check (char_length(notes) <= 500),
  status               text not null default 'posted' check (status in ('posted', 'voided')),
  reverses_document_id uuid unique references public.inventory_documents (id),
  voided_at            timestamptz,
  voided_by            uuid,
  void_reason          text,
  conversion_loss_base numeric(14, 3) check (conversion_loss_base >= 0),
  source_type          text check (source_type ~ '^[a-z_]+$'),  -- 'sale', 'purchase' (B4/B5)
  source_id            uuid,
  client_request_id    uuid unique,
  created_at           timestamptz not null default now(),
  created_by           uuid default auth.uid(),
  unique (document_type, number),
  constraint inventory_documents_transfer check (
    document_type <> 'transfer' or (target_inventory_id is not null and target_inventory_id <> inventory_id)),
  constraint inventory_documents_void check (
    (status = 'posted' and voided_at is null) or (status = 'voided' and void_reason is not null)),
  constraint inventory_documents_reversal check ((document_type = 'reversal') = (reverses_document_id is not null))
);
create index inventory_documents_inventory_idx on public.inventory_documents (inventory_id, document_date desc);
create index inventory_documents_target_idx on public.inventory_documents (target_inventory_id) where target_inventory_id is not null;
create index inventory_documents_source_idx on public.inventory_documents (source_type, source_id) where source_id is not null;

-- ── Movimientos (kardex) ─────────────────────────────────────────────────────

create table public.inventory_movements (
  id                   bigint generated always as identity primary key,
  document_id          uuid not null references public.inventory_documents (id),
  inventory_id         uuid not null references public.inventories (id),
  variant_id           uuid not null references public.product_variants (id),
  movement_date        date not null,
  direction            smallint not null check (direction in (-1, 1)),
  quantity             numeric(14, 3) not null check (quantity > 0),
  unit_cost            numeric(14, 4) check (unit_cost >= 0),
  reverses_movement_id bigint unique references public.inventory_movements (id),
  created_at           timestamptz not null default now(),
  created_by           uuid default auth.uid()
);
create index inventory_movements_kardex_idx
  on public.inventory_movements (inventory_id, variant_id, movement_date, id);
create index inventory_movements_document_idx on public.inventory_movements (document_id);

-- ── Existencias ──────────────────────────────────────────────────────────────

/* Saldo actual por inventario y presentación. Lo mantienen solo las funciones de este archivo. */
create table public.stock_balances (
  inventory_id   uuid not null references public.inventories (id),
  variant_id     uuid not null references public.product_variants (id),
  quantity       numeric(14, 3) not null default 0 check (quantity >= 0),  -- nunca negativo (N-4)
  last_unit_cost numeric(14, 4) check (last_unit_cost >= 0),
  updated_at     timestamptz not null default now(),
  primary key (inventory_id, variant_id)
);

-- ── Inmutabilidad ────────────────────────────────────────────────────────────

create function app.forbid_ledger_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Los movimientos de inventario no se modifican ni se borran: se anulan con un documento inverso'
    using errcode = 'P0001', hint = 'FORBIDDEN';
end;
$$;

create trigger inventory_movements_immutable
  before update or delete on public.inventory_movements
  for each row execute function app.forbid_ledger_change();
create trigger inventory_movements_no_truncate
  before truncate on public.inventory_movements
  for each statement execute function app.forbid_ledger_change();

/* Un documento solo cambia una vez: de registrado a anulado (con motivo). */
create function app.guard_inventory_document()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' or old.status <> 'posted' or new.status <> 'voided'
     or (to_jsonb(new) - 'status' - 'voided_at' - 'voided_by' - 'void_reason')
        is distinct from (to_jsonb(old) - 'status' - 'voided_at' - 'voided_by' - 'void_reason') then
    raise exception 'Los documentos de inventario no se modifican: solo se anulan'
      using errcode = 'P0001', hint = 'FORBIDDEN';
  end if;
  return new;
end;
$$;

create trigger inventory_documents_guard
  before update or delete on public.inventory_documents
  for each row execute function app.guard_inventory_document();
create trigger inventory_documents_no_truncate
  before truncate on public.inventory_documents
  for each statement execute function app.forbid_ledger_change();

-- ── Funciones internas ───────────────────────────────────────────────────────

/* Fecha de hoy en la zona horaria de la empresa. */
create function app.inv_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone (select c.timezone from public.company_settings c))::date;
$$;

create function app.inv_variant_label(p_variant uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select c.display_name from public.v_catalog c where c.variant_id = p_variant;
$$;

create function app.inv_check_date(p_date date)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := app.inv_today();
  v_limit integer;
begin
  if p_date is null then
    perform app.raise_domain('VALIDATION', 'Indica la fecha');
  end if;
  if p_date > v_today then
    perform app.raise_domain('VALIDATION', 'No se permiten fechas futuras');
  end if;
  select backdate_limit_days into v_limit from public.company_settings;
  if p_date < v_today - v_limit then
    perform app.raise_domain('VALIDATION', format('Solo se puede registrar hasta %s días atrás', v_limit));
  end if;
end;
$$;

/* El inventario existe, está activo, su sucursal también y el usuario tiene acceso. */
create function app.inv_check_inventory(p_inventory uuid, p_require_access boolean default true)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.inventories i join public.branches b on b.id = i.branch_id
     where i.id = p_inventory and i.is_active and b.is_active
  ) then
    perform app.raise_domain('VALIDATION', 'El inventario no existe o está desactivado');
  end if;
  if p_require_access and not app.can_access_inventory(p_inventory) then
    perform app.raise_domain('FORBIDDEN', 'No tienes acceso a este inventario');
  end if;
end;
$$;

/* Cantidad válida para la presentación: > 0, máximo 3 decimales y entera si la unidad no admite decimales. */
create function app.inv_check_quantity(p_variant uuid, p_quantity numeric)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_decimals boolean;
begin
  select u.allows_decimals into v_decimals
    from public.product_variants v
    join public.products p on p.id = v.product_id
    join public.units u on u.id = v.unit_id
   where v.id = p_variant and v.is_active and p.is_active;
  if not found then
    perform app.raise_domain('VALIDATION', 'Producto no encontrado o desactivado');
  end if;
  if p_quantity is null or p_quantity <= 0 then
    perform app.raise_domain('VALIDATION', 'La cantidad debe ser mayor a 0');
  end if;
  if p_quantity <> round(p_quantity, 3) then
    perform app.raise_domain('VALIDATION', 'Usa como máximo 3 decimales');
  end if;
  if not v_decimals and p_quantity <> trunc(p_quantity) then
    perform app.raise_domain('VALIDATION',
      format('%s se maneja en unidades enteras', app.inv_variant_label(p_variant)));
  end if;
end;
$$;

/* Líneas de un documento: [{variant_id, quantity, unit_cost?, counted_quantity?}], sin repetidos. */
create function app.inv_parse_lines(p_lines jsonb)
returns table (variant_id uuid, quantity numeric, unit_cost numeric, counted_quantity numeric)
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    perform app.raise_domain('VALIDATION', 'Agrega al menos un producto');
  end if;
  if (select count(distinct l ->> 'variant_id') from jsonb_array_elements(p_lines) l)
     <> jsonb_array_length(p_lines) then
    perform app.raise_domain('VALIDATION', 'Un producto aparece más de una vez');
  end if;
  return query
    select (l ->> 'variant_id')::uuid,
           (l ->> 'quantity')::numeric,
           (l ->> 'unit_cost')::numeric,
           (l ->> 'counted_quantity')::numeric
      from jsonb_array_elements(p_lines) l
     order by (l ->> 'variant_id')::uuid;  -- orden fijo de bloqueo: evita interbloqueos
exception
  when invalid_text_representation then
    perform app.raise_domain('VALIDATION', 'Datos de producto inválidos');
end;
$$;

/* Bloquea (creándolo si no existe) el saldo de una presentación en un inventario. */
create function app.inv_lock_balance(p_inventory uuid, p_variant uuid)
returns public.stock_balances
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance public.stock_balances;
begin
  insert into public.stock_balances (inventory_id, variant_id) values (p_inventory, p_variant)
  on conflict do nothing;
  select * into v_balance from public.stock_balances
   where inventory_id = p_inventory and variant_id = p_variant
   for update;
  return v_balance;
end;
$$;

/* Saldo al cierre de una fecha (para ajustes con fecha pasada). */
create function app.inv_balance_at(p_inventory uuid, p_variant uuid, p_date date)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(direction * quantity), 0)
    from public.inventory_movements
   where inventory_id = p_inventory and variant_id = p_variant and movement_date <= p_date;
$$;

/* Verifica que el saldo diario acumulado nunca sea negativo (tras registrar con fecha pasada). */
create function app.inv_assert_history(p_inventory uuid, p_variant uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_date date;
begin
  select d into v_date
    from (select d, sum(net) over (order by d) as running
            from (select movement_date as d, sum(direction * quantity) as net
                    from public.inventory_movements
                   where inventory_id = p_inventory and variant_id = p_variant
                   group by movement_date) daily) acc
   where running < 0
   order by d
   limit 1;
  if v_date is not null then
    perform app.raise_domain('INSUFFICIENT_STOCK',
      format('Con esa fecha, el saldo de %s quedaría negativo el %s',
             app.inv_variant_label(p_variant), to_char(v_date, 'DD/MM/YYYY')));
  end if;
end;
$$;

/*
 * Aplica un movimiento: bloquea el saldo, valida que no quede negativo, actualiza el
 * saldo y el último costo, inserta el movimiento y, si la fecha es pasada, revisa el historial.
 * En salidas sin costo explícito usa el último costo conocido (valoración de la salida).
 */
create function app.inv_apply(
  p_document  uuid,
  p_inventory uuid,
  p_variant   uuid,
  p_direction smallint,
  p_quantity  numeric,
  p_date      date,
  p_unit_cost numeric default null,
  p_reverses  bigint default null
)
returns public.inventory_movements
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance  public.stock_balances;
  v_cost     numeric := p_unit_cost;
  v_movement public.inventory_movements;
begin
  v_balance := app.inv_lock_balance(p_inventory, p_variant);
  if v_balance.quantity + p_direction * p_quantity < 0 then
    perform app.raise_domain('INSUFFICIENT_STOCK',
      format('Stock insuficiente de %s: hay %s', app.inv_variant_label(p_variant),
             trim(trailing '.' from trim(trailing '0' from v_balance.quantity::text))));
  end if;
  if p_direction = -1 and v_cost is null then
    v_cost := v_balance.last_unit_cost;
  end if;

  update public.stock_balances
     set quantity = quantity + p_direction * p_quantity,
         last_unit_cost = case when p_direction = 1 and p_unit_cost is not null and p_reverses is null
                               then p_unit_cost else last_unit_cost end,
         updated_at = now()
   where inventory_id = p_inventory and variant_id = p_variant;

  insert into public.inventory_movements
    (document_id, inventory_id, variant_id, movement_date, direction, quantity, unit_cost, reverses_movement_id)
  values (p_document, p_inventory, p_variant, p_date, p_direction, p_quantity, v_cost, p_reverses)
  returning * into v_movement;

  if p_date < app.inv_today() then
    perform app.inv_assert_history(p_inventory, p_variant);
  end if;
  return v_movement;
end;
$$;

/* Documento existente para el mismo `client_request_id` (doble toque / reintento). */
create function app.inv_existing_request(p_request uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.inventory_documents
   where p_request is not null and client_request_id = p_request and created_by = auth.uid();
$$;

create function app.inv_new_document(
  p_type      public.inv_document_type,
  p_date      date,
  p_inventory uuid,
  p_target    uuid default null,
  p_reason    uuid default null,
  p_notes     text default null,
  p_request   uuid default null,
  p_reverses  uuid default null,
  p_loss_base numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_reason is not null and not exists (
    select 1 from public.movement_reasons where id = p_reason and document_type = p_type and is_active
  ) then
    perform app.raise_domain('VALIDATION', 'Motivo no válido para esta operación');
  end if;
  insert into public.inventory_documents
    (number, document_type, document_date, inventory_id, target_inventory_id, reason_id, notes,
     client_request_id, reverses_document_id, conversion_loss_base)
  values (app.next_document_number('inv_' || p_type::text), p_type, p_date, p_inventory, p_target, p_reason,
          nullif(trim(p_notes), ''), p_request, p_reverses, p_loss_base)
  returning id into v_id;
  return v_id;
end;
$$;

/* Registra el documento en la bitácora; las operaciones con fecha pasada son críticas. */
create function app.inv_log_document(p_document uuid, p_action app.audit_action)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc  public.inventory_documents;
  v_data jsonb;
begin
  select * into v_doc from public.inventory_documents where id = p_document;
  select to_jsonb(v_doc) || jsonb_build_object('lines', coalesce(jsonb_agg(jsonb_build_object(
           'variant_id', m.variant_id, 'inventory_id', m.inventory_id, 'direction', m.direction,
           'quantity', m.quantity, 'unit_cost', m.unit_cost) order by m.id), '[]'::jsonb))
    into v_data
    from public.inventory_movements m where m.document_id = p_document;
  perform app.log_action(
    p_action, 'inventory', 'public.inventory_documents', p_document::text, null, v_data,
    coalesce(v_doc.void_reason, v_doc.notes),
    case when v_doc.document_date < app.inv_today() then 'critical'::app.audit_severity end);
end;
$$;

-- ── RPC: documentos ──────────────────────────────────────────────────────────

/* Saldo inicial (propietario/administrador). Costo unitario opcional. */
create function public.inv_post_opening(
  p_inventory uuid, p_date date, p_lines jsonb, p_notes text default null, p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc  uuid := app.inv_existing_request(p_request_id);
  v_line record;
begin
  if v_doc is not null then return v_doc; end if;
  perform app.require_role('owner', 'admin');
  perform app.inv_check_inventory(p_inventory);
  perform app.inv_check_date(p_date);
  v_doc := app.inv_new_document('opening', p_date, p_inventory, null, null, p_notes, p_request_id);
  for v_line in select * from app.inv_parse_lines(p_lines) loop
    perform app.inv_check_quantity(v_line.variant_id, v_line.quantity);
    if v_line.unit_cost < 0 then
      perform app.raise_domain('VALIDATION', 'El costo no puede ser negativo');
    end if;
    perform app.inv_apply(v_doc, p_inventory, v_line.variant_id, 1::smallint, v_line.quantity, p_date, v_line.unit_cost);
  end loop;
  perform app.inv_log_document(v_doc, 'create');
  return v_doc;
end;
$$;

/* Entrada o salida no comercial con motivo (operador, administrador, propietario). */
create function app.inv_post_simple(
  p_type public.inv_document_type, p_inventory uuid, p_date date, p_reason uuid, p_lines jsonb,
  p_notes text, p_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc       uuid := app.inv_existing_request(p_request_id);
  v_line      record;
  v_direction smallint := case when p_type = 'entry' then 1 else -1 end;
begin
  if v_doc is not null then return v_doc; end if;
  perform app.require_role('owner', 'admin', 'operator');
  perform app.inv_check_inventory(p_inventory);
  perform app.inv_check_date(p_date);
  if p_reason is null then
    perform app.raise_domain('VALIDATION', 'Indica el motivo');
  end if;
  v_doc := app.inv_new_document(p_type, p_date, p_inventory, null, p_reason, p_notes, p_request_id);
  for v_line in select * from app.inv_parse_lines(p_lines) loop
    perform app.inv_check_quantity(v_line.variant_id, v_line.quantity);
    if v_line.unit_cost < 0 then
      perform app.raise_domain('VALIDATION', 'El costo no puede ser negativo');
    end if;
    perform app.inv_apply(v_doc, p_inventory, v_line.variant_id, v_direction, v_line.quantity, p_date,
                          case when v_direction = 1 then v_line.unit_cost end);
  end loop;
  perform app.inv_log_document(v_doc, 'create');
  return v_doc;
end;
$$;

create function public.inv_post_entry(
  p_inventory uuid, p_date date, p_reason uuid, p_lines jsonb, p_notes text default null,
  p_request_id uuid default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select app.inv_post_simple('entry', p_inventory, p_date, p_reason, p_lines, p_notes, p_request_id);
$$;

create function public.inv_post_exit(
  p_inventory uuid, p_date date, p_reason uuid, p_lines jsonb, p_notes text default null,
  p_request_id uuid default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select app.inv_post_simple('exit', p_inventory, p_date, p_reason, p_lines, p_notes, p_request_id);
$$;

/*
 * Ajuste por conteo (propietario/administrador). Cada línea trae la cantidad contada
 * (`counted_quantity`) al cierre de la fecha; el sistema registra la diferencia.
 */
create function public.inv_post_adjustment(
  p_inventory uuid, p_date date, p_reason uuid, p_lines jsonb, p_notes text default null,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc     uuid := app.inv_existing_request(p_request_id);
  v_line    record;
  v_current numeric;
  v_diff    numeric;
  v_applied integer := 0;
begin
  if v_doc is not null then return v_doc; end if;
  perform app.require_role('owner', 'admin');
  perform app.inv_check_inventory(p_inventory);
  perform app.inv_check_date(p_date);
  if p_reason is null then
    perform app.raise_domain('VALIDATION', 'Indica el motivo del ajuste');
  end if;
  v_doc := app.inv_new_document('adjustment', p_date, p_inventory, null, p_reason, p_notes, p_request_id);
  for v_line in select * from app.inv_parse_lines(p_lines) loop
    if v_line.counted_quantity is null or v_line.counted_quantity < 0 then
      perform app.raise_domain('VALIDATION', 'La cantidad contada no puede ser negativa');
    end if;
    if v_line.counted_quantity > 0 then
      perform app.inv_check_quantity(v_line.variant_id, v_line.counted_quantity);
    end if;
    perform app.inv_lock_balance(p_inventory, v_line.variant_id);
    v_current := app.inv_balance_at(p_inventory, v_line.variant_id, p_date);
    v_diff := v_line.counted_quantity - v_current;
    if v_diff <> 0 then
      perform app.inv_apply(v_doc, p_inventory, v_line.variant_id, sign(v_diff)::smallint, abs(v_diff), p_date);
      v_applied := v_applied + 1;
    end if;
  end loop;
  if v_applied = 0 then
    perform app.raise_domain('VALIDATION', 'Las cantidades contadas coinciden con el sistema: no hay nada que ajustar');
  end if;
  perform app.inv_log_document(v_doc, 'adjust');
  return v_doc;
end;
$$;

/* Traspaso entre inventarios (también entre sucursales), al último costo del origen. */
create function public.inv_post_transfer(
  p_from uuid, p_to uuid, p_date date, p_lines jsonb, p_notes text default null, p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc  uuid := app.inv_existing_request(p_request_id);
  v_line record;
  v_out  public.inventory_movements;
begin
  if v_doc is not null then return v_doc; end if;
  perform app.require_role('owner', 'admin', 'operator');
  if p_from = p_to then
    perform app.raise_domain('VALIDATION', 'El inventario de destino debe ser distinto del de origen');
  end if;
  perform app.inv_check_inventory(p_from);
  perform app.inv_check_inventory(p_to, false);  -- se puede enviar a otra sucursal
  perform app.inv_check_date(p_date);
  v_doc := app.inv_new_document('transfer', p_date, p_from, p_to, null, p_notes, p_request_id);
  for v_line in select * from app.inv_parse_lines(p_lines) loop
    perform app.inv_check_quantity(v_line.variant_id, v_line.quantity);
    v_out := app.inv_apply(v_doc, p_from, v_line.variant_id, (-1)::smallint, v_line.quantity, p_date);
    perform app.inv_apply(v_doc, p_to, v_line.variant_id, 1::smallint, v_line.quantity, p_date, v_out.unit_cost);
  end loop;
  perform app.inv_log_document(v_doc, 'transfer');
  return v_doc;
end;
$$;

/*
 * Fraccionamiento: sale `p_from_qty` de una presentación y entra `p_to_qty` de otra del
 * mismo producto (ej.: 1 saco de 40 kg → 39,5 kg sueltos). La diferencia en unidades base
 * queda registrada como merma del fraccionamiento.
 */
create function public.inv_post_conversion(
  p_inventory uuid, p_date date, p_from_variant uuid, p_from_qty numeric, p_to_variant uuid, p_to_qty numeric,
  p_notes text default null, p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc      uuid := app.inv_existing_request(p_request_id);
  v_from     public.product_variants;
  v_to       public.product_variants;
  v_expected numeric;
  v_out      public.inventory_movements;
begin
  if v_doc is not null then return v_doc; end if;
  perform app.require_role('owner', 'admin', 'operator');
  perform app.inv_check_inventory(p_inventory);
  perform app.inv_check_date(p_date);
  perform app.inv_check_quantity(p_from_variant, p_from_qty);
  perform app.inv_check_quantity(p_to_variant, p_to_qty);
  select * into v_from from public.product_variants where id = p_from_variant;
  select * into v_to from public.product_variants where id = p_to_variant;
  if v_from.id = v_to.id or v_from.product_id <> v_to.product_id then
    perform app.raise_domain('VALIDATION', 'Elige dos presentaciones distintas del mismo producto');
  end if;
  v_expected := p_from_qty * v_from.factor;
  if p_to_qty * v_to.factor > v_expected then
    perform app.raise_domain('VALIDATION',
      format('No puede resultar más de lo que había: como máximo %s',
             trim(trailing '.' from trim(trailing '0' from round(v_expected / v_to.factor, 3)::text))));
  end if;

  v_doc := app.inv_new_document('conversion', p_date, p_inventory, null, null, p_notes, p_request_id, null,
                                round(v_expected - p_to_qty * v_to.factor, 3));
  v_out := app.inv_apply(v_doc, p_inventory, p_from_variant, (-1)::smallint, p_from_qty, p_date);
  perform app.inv_apply(v_doc, p_inventory, p_to_variant, 1::smallint, p_to_qty, p_date,
                        case when v_out.unit_cost is not null
                             then round(v_out.unit_cost * p_from_qty / p_to_qty, 4) end);
  perform app.inv_log_document(v_doc, 'convert');
  return v_doc;
end;
$$;

/*
 * Anula un documento con un documento inverso fechado hoy. El stock actual debe alcanzar
 * para revertir (p. ej., no se anula una entrada cuya mercadería ya salió).
 * Operador: solo sus documentos del día (entradas, salidas, traspasos, fraccionamientos).
 */
create function public.inv_void_document(p_document uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc      public.inventory_documents;
  v_reversal uuid;
  v_move     record;
  v_today    date := app.inv_today();
begin
  perform app.require_role('owner', 'admin', 'operator');
  select * into v_doc from public.inventory_documents where id = p_document for update;
  if not found or not app.can_access_inventory(v_doc.inventory_id) then
    perform app.raise_domain('NOT_FOUND', 'Documento no encontrado');
  end if;
  if v_doc.status = 'voided' then
    perform app.raise_domain('CONFLICT', 'El documento ya está anulado');
  end if;
  if v_doc.document_type = 'reversal' then
    perform app.raise_domain('VALIDATION', 'Un documento inverso no se anula');
  end if;
  if v_doc.source_type is not null then
    perform app.raise_domain('FORBIDDEN', 'Este movimiento se anula desde su venta o compra');
  end if;
  if app.current_user_role() = 'operator' and not (
       v_doc.created_by = auth.uid()
       and (v_doc.created_at at time zone (select timezone from public.company_settings))::date = v_today
       and v_doc.document_type in ('entry', 'exit', 'transfer', 'conversion')) then
    perform app.raise_domain('FORBIDDEN', 'Solo puedes anular tus propias operaciones del día');
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then
    perform app.raise_domain('VALIDATION', 'Indica el motivo de la anulación');
  end if;

  v_reversal := app.inv_new_document('reversal', v_today, v_doc.inventory_id, v_doc.target_inventory_id,
                                     null, 'Anulación: ' || trim(p_reason), null, v_doc.id);
  for v_move in
    select * from public.inventory_movements where document_id = v_doc.id order by variant_id, inventory_id, id
  loop
    perform app.inv_apply(v_reversal, v_move.inventory_id, v_move.variant_id, (-v_move.direction)::smallint,
                          v_move.quantity, v_today, v_move.unit_cost, v_move.id);
  end loop;

  update public.inventory_documents
     set status = 'voided', voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
   where id = v_doc.id;
  perform app.inv_log_document(v_doc.id, 'void');
  return v_reversal;
end;
$$;

revoke execute on function
  public.inv_post_opening(uuid, date, jsonb, text, uuid),
  public.inv_post_entry(uuid, date, uuid, jsonb, text, uuid),
  public.inv_post_exit(uuid, date, uuid, jsonb, text, uuid),
  public.inv_post_adjustment(uuid, date, uuid, jsonb, text, uuid),
  public.inv_post_transfer(uuid, uuid, date, jsonb, text, uuid),
  public.inv_post_conversion(uuid, date, uuid, numeric, uuid, numeric, text, uuid),
  public.inv_void_document(uuid, text)
  from public, anon;
grant execute on function
  public.inv_post_opening(uuid, date, jsonb, text, uuid),
  public.inv_post_entry(uuid, date, uuid, jsonb, text, uuid),
  public.inv_post_exit(uuid, date, uuid, jsonb, text, uuid),
  public.inv_post_adjustment(uuid, date, uuid, jsonb, text, uuid),
  public.inv_post_transfer(uuid, uuid, date, jsonb, text, uuid),
  public.inv_post_conversion(uuid, date, uuid, numeric, uuid, numeric, text, uuid),
  public.inv_void_document(uuid, text)
  to authenticated;

-- ── Bitácora de motivos (catálogo editable) ─────────────────────────────────

select app.enable_tracking('public.movement_reasons', 'inventory', 'is_active');

-- ── Privilegios y RLS ────────────────────────────────────────────────────────

revoke all on table public.movement_reasons, public.inventory_documents, public.inventory_movements,
  public.stock_balances from public, anon, authenticated;

alter table public.movement_reasons enable row level security;
alter table public.inventory_documents enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.stock_balances enable row level security;

grant select on public.movement_reasons, public.inventory_documents, public.inventory_movements,
  public.stock_balances to authenticated;
grant insert (code, name, document_type), update (name, is_active) on public.movement_reasons to authenticated;

create policy movement_reasons_select on public.movement_reasons for select to authenticated
  using (app.is_active_user());
create policy movement_reasons_insert on public.movement_reasons for insert to authenticated
  with check (app.has_role('owner', 'admin'));
create policy movement_reasons_update on public.movement_reasons for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

create policy inventory_documents_select on public.inventory_documents for select to authenticated
  using (app.is_active_user() and (app.can_access_inventory(inventory_id)
         or (target_inventory_id is not null and app.can_access_inventory(target_inventory_id))));
create policy inventory_movements_select on public.inventory_movements for select to authenticated
  using (app.is_active_user() and app.can_access_inventory(inventory_id));
create policy stock_balances_select on public.stock_balances for select to authenticated
  using (app.is_active_user() and app.can_access_inventory(inventory_id));

-- ── Vistas (respetan RLS del usuario) ────────────────────────────────────────

/* Existencias valoradas a precio vigente (del inventario o base) y a último costo. */
create view public.v_stock with (security_invoker = true) as
select sb.inventory_id,
       i.name                                     as inventory_name,
       i.branch_id,
       b.name                                     as branch_name,
       c.variant_id,
       c.product_id,
       c.display_name,
       c.product_name,
       c.variant_name,
       c.sku,
       c.category_id,
       c.category_name,
       c.unit_symbol,
       c.factor,
       c.base_unit_symbol,
       sb.quantity,
       round(sb.quantity * c.factor, 3)           as base_quantity,
       c.min_stock,
       (sb.quantity < c.min_stock)                as below_min,
       sb.last_unit_cost,
       coalesce(ip.price, c.base_price)           as unit_price,
       round(sb.quantity * coalesce(ip.price, c.base_price), 2) as value_at_price,
       round(sb.quantity * sb.last_unit_cost, 2)  as value_at_cost,
       c.is_active,
       sb.updated_at
  from public.stock_balances sb
  join public.inventories i on i.id = sb.inventory_id
  join public.branches b on b.id = i.branch_id
  join public.v_catalog c on c.variant_id = sb.variant_id
  left join public.inventory_prices ip on ip.inventory_id = sb.inventory_id and ip.variant_id = sb.variant_id;

/* Kardex: cada movimiento con su documento y el saldo acumulado por inventario y presentación. */
create view public.v_kardex with (security_invoker = true) as
select m.id,
       m.movement_date,
       m.inventory_id,
       i.name                     as inventory_name,
       m.variant_id,
       c.display_name,
       c.unit_symbol,
       m.direction,
       m.quantity,
       m.direction * m.quantity   as signed_quantity,
       sum(m.direction * m.quantity) over (
         partition by m.inventory_id, m.variant_id order by m.movement_date, m.id
       )                          as balance,
       m.unit_cost,
       d.id                       as document_id,
       d.document_type,
       d.number                   as document_number,
       d.status                   as document_status,
       d.source_type,
       d.source_id,
       r.name                     as reason_name,
       d.notes,
       m.reverses_movement_id,
       coalesce(nullif(p.full_name, ''), p.email) as created_by_name,
       m.created_at
  from public.inventory_movements m
  join public.inventory_documents d on d.id = m.document_id
  join public.inventories i on i.id = m.inventory_id
  join public.v_catalog c on c.variant_id = m.variant_id
  left join public.movement_reasons r on r.id = d.reason_id
  left join public.profiles p on p.id = m.created_by;

/* Documentos con nombres para listados. */
create view public.v_inventory_documents with (security_invoker = true) as
select d.id,
       d.number,
       d.document_type,
       d.document_date,
       d.status,
       d.inventory_id,
       i.name                     as inventory_name,
       d.target_inventory_id,
       t.name                     as target_inventory_name,
       d.reason_id,
       r.name                     as reason_name,
       d.notes,
       d.conversion_loss_base,
       d.reverses_document_id,
       rv.number                  as reverses_document_number,
       (select x.id from public.inventory_documents x where x.reverses_document_id = d.id) as reversed_by_document_id,
       d.void_reason,
       d.voided_at,
       d.source_type,
       d.source_id,
       d.created_at,
       d.created_by,
       coalesce(nullif(p.full_name, ''), p.email) as created_by_name,
       (select count(*) from public.inventory_movements m where m.document_id = d.id) as movement_count
  from public.inventory_documents d
  join public.inventories i on i.id = d.inventory_id
  left join public.inventories t on t.id = d.target_inventory_id
  left join public.movement_reasons r on r.id = d.reason_id
  left join public.inventory_documents rv on rv.id = d.reverses_document_id
  left join public.profiles p on p.id = d.created_by;

revoke all on public.v_stock, public.v_kardex, public.v_inventory_documents from public, anon, authenticated;
grant select on public.v_stock, public.v_kardex, public.v_inventory_documents to authenticated;
