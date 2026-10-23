-- ════════════════════════════════════════════════════════════════════════════
-- Bloque 3 (1/2) · Catálogo, inventarios y precios.
-- Decisiones: docs/roadmap/08-decisiones-del-nucleo.md §2 (presentaciones), §3 (precios).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Unidades de medida ───────────────────────────────────────────────────────

create table public.units (
  id              uuid primary key default gen_random_uuid(),
  code            text not null check (code ~ '^[a-z0-9_]{1,20}$'),
  name            text not null check (char_length(trim(name)) between 1 and 40),
  symbol          text not null check (char_length(trim(symbol)) between 1 and 12),
  allows_decimals boolean not null default false,
  is_active       boolean not null default true,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid
);
create unique index units_code_key on public.units (code);
create unique index units_name_key on public.units (lower(trim(name)));

insert into public.units (code, name, symbol, allows_decimals, created_at, updated_at) values
  ('unidad',   'Unidad',    'u',     false, now(), now()),
  ('kg',       'Kilogramo', 'kg',    true,  now(), now()),
  ('litro',    'Litro',     'l',     true,  now(), now()),
  ('saco',     'Saco',      'saco',  false, now(), now()),
  ('bolsa',    'Bolsa',     'bolsa', false, now(), now()),
  ('quintal',  'Quintal',   'qq',    true,  now(), now()),
  ('arroba',   'Arroba',    '@',     true,  now(), now()),
  ('tonelada', 'Tonelada',  't',     true,  now(), now()),
  ('caja',     'Caja',      'caja',  false, now(), now()),
  ('paquete',  'Paquete',   'paq',   false, now(), now()),
  ('frasco',   'Frasco',    'fco',   false, now(), now()),
  ('metro',    'Metro',     'm',     true,  now(), now()),
  ('cabeza',   'Cabeza',    'cab',   false, now(), now());

-- ── Categorías ───────────────────────────────────────────────────────────────

create table public.product_categories (
  id        uuid primary key default gen_random_uuid(),
  name      text not null check (char_length(trim(name)) between 2 and 60),
  is_active boolean not null default true,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid
);
create unique index product_categories_name_key on public.product_categories (lower(trim(name)));

-- ── Productos base y presentaciones ──────────────────────────────────────────

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(trim(name)) between 2 and 120),
  category_id         uuid references public.product_categories (id),
  base_unit_id        uuid not null references public.units (id),
  description         text check (char_length(description) <= 500),
  is_active           boolean not null default true,
  deactivated_at      timestamptz,
  deactivation_reason text,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid,
  constraint products_deactivation_reason check (is_active or deactivation_reason is not null)
);
create unique index products_name_key on public.products (lower(trim(name)));
comment on table public.products is
  'Producto base. Su unidad base permite sumar todas sus presentaciones (ej.: kg).';

/*
 * Presentación: lo que se compra, vende, traspasa y cuenta. Stock y kardex propios.
 * `factor` = cuántas unidades base contiene (saco 40 kg → 40). Inmutable: si estaba mal,
 * se crea otra presentación y se desactiva la anterior (el historial no cambia de sentido).
 */
create table public.product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id),
  name                text not null check (char_length(trim(name)) between 1 and 80),
  sku                 text check (char_length(trim(sku)) between 1 and 40),
  unit_id             uuid not null references public.units (id),
  factor              numeric(14, 6) not null check (factor > 0),
  base_price          numeric(14, 2) not null default 0 check (base_price >= 0),
  min_stock           numeric(14, 3) not null default 0 check (min_stock >= 0),
  is_default          boolean not null default false,
  is_active           boolean not null default true,
  deactivated_at      timestamptz,
  deactivation_reason text,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid,
  constraint product_variants_deactivation_reason check (is_active or deactivation_reason is not null)
);
create unique index product_variants_name_key on public.product_variants (product_id, lower(trim(name)));
create unique index product_variants_sku_key on public.product_variants (lower(trim(sku))) where sku is not null;
create unique index product_variants_one_default on public.product_variants (product_id) where is_default;
create index product_variants_product_idx on public.product_variants (product_id);

-- ── Inventarios ──────────────────────────────────────────────────────────────

create table public.inventories (
  id                  uuid primary key default gen_random_uuid(),
  branch_id           uuid not null references public.branches (id),
  name                text not null check (char_length(trim(name)) between 2 and 80),
  description         text check (char_length(description) <= 300),
  is_active           boolean not null default true,
  deactivated_at      timestamptz,
  deactivation_reason text,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid,
  constraint inventories_deactivation_reason check (is_active or deactivation_reason is not null)
);
create unique index inventories_name_key on public.inventories (lower(trim(name)));
create index inventories_branch_idx on public.inventories (branch_id);

insert into public.inventories (branch_id, name, created_at, updated_at)
select id, 'Inventario principal', now(), now() from public.branches where name = 'Sucursal principal';

create function app.can_access_inventory(p_inventory uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.inventories i
     where i.id = p_inventory and app.can_access_branch(i.branch_id)
  );
$$;

-- ── Precios ──────────────────────────────────────────────────────────────────

/* Precio de una presentación en un inventario (ej.: otra ciudad). `null` = usa el precio base. */
create table public.inventory_prices (
  id           uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventories (id),
  variant_id   uuid not null references public.product_variants (id),
  price        numeric(14, 2) check (price >= 0),
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid,
  unique (inventory_id, variant_id)
);

/* Historial de precios: cada cambio con fecha, usuario y origen (motivo). */
create table public.price_changes (
  id           bigint generated always as identity primary key,
  variant_id   uuid not null references public.product_variants (id),
  inventory_id uuid references public.inventories (id),  -- null = precio base
  old_price    numeric(14, 2),
  new_price    numeric(14, 2),
  reason       text,
  changed_at   timestamptz not null default now(),
  changed_by   uuid default auth.uid()
);
create index price_changes_variant_idx on public.price_changes (variant_id, changed_at desc);

create function app.record_price_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old numeric;
  v_new numeric;
begin
  if tg_table_name = 'product_variants' then
    v_old := case when tg_op = 'UPDATE' then old.base_price end;
    v_new := new.base_price;
    if v_old is not distinct from v_new then return new; end if;
    insert into public.price_changes (variant_id, inventory_id, old_price, new_price, reason)
    values (new.id, null, v_old, v_new, nullif(current_setting('app.reason', true), ''));
  else
    v_old := case when tg_op = 'UPDATE' then old.price end;
    v_new := new.price;
    if v_old is not distinct from v_new then return new; end if;
    insert into public.price_changes (variant_id, inventory_id, old_price, new_price, reason)
    values (new.variant_id, new.inventory_id, v_old, v_new, nullif(current_setting('app.reason', true), ''));
  end if;
  return new;
end;
$$;

create trigger record_price_change
  after insert or update of base_price on public.product_variants
  for each row execute function app.record_price_change();
create trigger record_price_change
  after insert or update of price on public.inventory_prices
  for each row execute function app.record_price_change();

-- ── Metadatos y bitácora ─────────────────────────────────────────────────────

select app.enable_tracking('public.units', 'inventory', 'is_active');
select app.enable_tracking('public.product_categories', 'inventory', 'is_active');
select app.enable_tracking('public.products', 'inventory', 'is_active');
select app.enable_tracking('public.product_variants', 'inventory', 'base_price:price_change,is_active');
select app.enable_tracking('public.inventories', 'inventory', 'is_active');
select app.enable_tracking('public.inventory_prices', 'inventory', 'price:price_change');

-- ── Privilegios y RLS ────────────────────────────────────────────────────────

revoke all on table public.units, public.product_categories, public.products,
  public.product_variants, public.inventories, public.inventory_prices, public.price_changes
  from public, anon, authenticated;

alter table public.units enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventories enable row level security;
alter table public.inventory_prices enable row level security;
alter table public.price_changes enable row level security;

-- Catálogos: lectura para usuarios activos; propietario y administrador los mantienen.
grant select on public.units, public.product_categories, public.products,
  public.product_variants, public.price_changes to authenticated;

grant insert (code, name, symbol, allows_decimals), update (name, symbol, is_active)
  on public.units to authenticated;
grant insert (name), update (name, is_active) on public.product_categories to authenticated;
grant update (name, category_id, description) on public.products to authenticated;
grant update (name, sku, base_price, min_stock) on public.product_variants to authenticated;

create policy units_select on public.units for select to authenticated using (app.is_active_user());
create policy units_insert on public.units for insert to authenticated with check (app.has_role('owner', 'admin'));
create policy units_update on public.units for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

create policy categories_select on public.product_categories for select to authenticated using (app.is_active_user());
create policy categories_insert on public.product_categories for insert to authenticated
  with check (app.has_role('owner', 'admin'));
create policy categories_update on public.product_categories for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

create policy products_select on public.products for select to authenticated using (app.is_active_user());
create policy products_update on public.products for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

create policy variants_select on public.product_variants for select to authenticated using (app.is_active_user());
create policy variants_update on public.product_variants for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

create policy price_changes_select on public.price_changes for select to authenticated using (app.is_active_user());

-- Inventarios: cada uno ve los de sus sucursales; propietario y administrador los mantienen.
grant select on public.inventories to authenticated;
grant insert (branch_id, name, description), update (name, description) on public.inventories to authenticated;
create policy inventories_select on public.inventories for select to authenticated
  using (app.is_active_user() and app.can_access_branch(branch_id));
create policy inventories_insert on public.inventories for insert to authenticated
  with check (app.has_role('owner', 'admin'));
create policy inventories_update on public.inventories for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

grant select on public.inventory_prices to authenticated;
create policy inventory_prices_select on public.inventory_prices for select to authenticated
  using (app.is_active_user() and app.can_access_inventory(inventory_id));

-- ── RPC: catálogo ────────────────────────────────────────────────────────────

/* Crea un producto con su presentación por defecto (unidad base, factor 1). */
create function public.inv_create_product(
  p_name        text,
  p_base_unit   uuid,
  p_category    uuid default null,
  p_description text default null,
  p_base_price  numeric default 0,
  p_sku         text default null,
  p_min_stock   numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid;
  v_unit    public.units;
begin
  perform app.require_role('owner', 'admin');
  select * into v_unit from public.units where id = p_base_unit and is_active;
  if not found then
    perform app.raise_domain('VALIDATION', 'Unidad de medida no válida');
  end if;
  insert into public.products (name, base_unit_id, category_id, description)
  values (trim(p_name), p_base_unit, p_category, nullif(trim(p_description), ''))
  returning id into v_product;
  insert into public.product_variants (product_id, name, sku, unit_id, factor, base_price, min_stock, is_default)
  values (v_product, v_unit.name, nullif(trim(p_sku), ''), p_base_unit, 1, coalesce(p_base_price, 0),
          coalesce(p_min_stock, 0), true);
  return v_product;
exception
  when unique_violation then
    perform app.raise_domain('DUPLICATE', 'Ya existe un producto con ese nombre o código');
end;
$$;

/* Agrega una presentación (ej.: "Saco 40 kg", unidad saco, factor 40). */
create function public.inv_add_variant(
  p_product    uuid,
  p_name       text,
  p_unit       uuid,
  p_factor     numeric,
  p_base_price numeric default 0,
  p_sku        text default null,
  p_min_stock  numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform app.require_role('owner', 'admin');
  if not exists (select 1 from public.products where id = p_product and is_active) then
    perform app.raise_domain('NOT_FOUND', 'Producto no encontrado o desactivado');
  end if;
  if not exists (select 1 from public.units where id = p_unit and is_active) then
    perform app.raise_domain('VALIDATION', 'Unidad de medida no válida');
  end if;
  if p_factor is null or p_factor <= 0 then
    perform app.raise_domain('VALIDATION', 'El factor debe ser mayor a 0');
  end if;
  insert into public.product_variants (product_id, name, sku, unit_id, factor, base_price, min_stock)
  values (p_product, trim(p_name), nullif(trim(p_sku), ''), p_unit, p_factor, coalesce(p_base_price, 0),
          coalesce(p_min_stock, 0))
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    perform app.raise_domain('DUPLICATE', 'Ya existe una presentación con ese nombre o código');
end;
$$;

/* Cambia el precio base de una presentación, con motivo para el historial. */
create function public.inv_set_base_price(p_variant uuid, p_price numeric, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.require_role('owner', 'admin');
  if p_price is null or p_price < 0 then
    perform app.raise_domain('VALIDATION', 'El precio no puede ser negativo');
  end if;
  perform app.set_reason(p_reason);
  update public.product_variants set base_price = round(p_price, 2) where id = p_variant;
  if not found then
    perform app.raise_domain('NOT_FOUND', 'Presentación no encontrada');
  end if;
end;
$$;

/* Precio propio de una presentación en un inventario; `null` vuelve al precio base. */
create function public.inv_set_inventory_price(
  p_inventory uuid, p_variant uuid, p_price numeric, p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.require_role('owner', 'admin');
  if p_price is not null and p_price < 0 then
    perform app.raise_domain('VALIDATION', 'El precio no puede ser negativo');
  end if;
  if not exists (select 1 from public.inventories where id = p_inventory)
     or not exists (select 1 from public.product_variants where id = p_variant) then
    perform app.raise_domain('NOT_FOUND', 'Inventario o presentación no encontrados');
  end if;
  perform app.set_reason(p_reason);
  insert into public.inventory_prices (inventory_id, variant_id, price)
  values (p_inventory, p_variant, round(p_price, 2))
  on conflict (inventory_id, variant_id) do update set price = excluded.price;
end;
$$;

/* Activar / desactivar (borrado lógico con motivo) de productos, presentaciones e inventarios. */
create function public.inv_set_active(p_entity text, p_id uuid, p_active boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.require_role('owner', 'admin');
  if p_entity not in ('product', 'variant', 'inventory') then
    perform app.raise_domain('VALIDATION', 'Entidad no válida');
  end if;
  if not p_active and char_length(trim(coalesce(p_reason, ''))) < 3 then
    perform app.raise_domain('VALIDATION', 'Indica el motivo de la desactivación');
  end if;
  perform app.set_reason(p_reason);
  execute format(
    'update public.%I set is_active = $1,
            deactivated_at = case when $1 then null else now() end,
            deactivation_reason = case when $1 then null else trim($2) end
      where id = $3 and is_active <> $1',
    case p_entity when 'product' then 'products' when 'variant' then 'product_variants' else 'inventories' end)
  using p_active, p_reason, p_id;
end;
$$;

revoke execute on function
  public.inv_create_product(text, uuid, uuid, text, numeric, text, numeric),
  public.inv_add_variant(uuid, text, uuid, numeric, numeric, text, numeric),
  public.inv_set_base_price(uuid, numeric, text),
  public.inv_set_inventory_price(uuid, uuid, numeric, text),
  public.inv_set_active(text, uuid, boolean, text)
  from public, anon;
grant execute on function
  public.inv_create_product(text, uuid, uuid, text, numeric, text, numeric),
  public.inv_add_variant(uuid, text, uuid, numeric, numeric, text, numeric),
  public.inv_set_base_price(uuid, numeric, text),
  public.inv_set_inventory_price(uuid, uuid, numeric, text),
  public.inv_set_active(text, uuid, boolean, text)
  to authenticated;

-- ── Vista de catálogo ────────────────────────────────────────────────────────

create view public.v_catalog with (security_invoker = true) as
select v.id                                   as variant_id,
       p.id                                   as product_id,
       p.name                                 as product_name,
       v.name                                 as variant_name,
       case when v.is_default and not exists (
              select 1 from public.product_variants o where o.product_id = v.product_id and o.id <> v.id)
            then p.name else p.name || ' · ' || v.name end as display_name,
       v.sku,
       v.is_default,
       v.factor,
       u.id                                   as unit_id,
       u.symbol                               as unit_symbol,
       u.allows_decimals,
       bu.id                                  as base_unit_id,
       bu.symbol                              as base_unit_symbol,
       v.base_price,
       v.min_stock,
       c.id                                   as category_id,
       c.name                                 as category_name,
       (p.is_active and v.is_active)          as is_active
  from public.product_variants v
  join public.products p on p.id = v.product_id
  join public.units u on u.id = v.unit_id
  join public.units bu on bu.id = p.base_unit_id
  left join public.product_categories c on c.id = p.category_id;

revoke all on public.v_catalog from public, anon, authenticated;
grant select on public.v_catalog to authenticated;
