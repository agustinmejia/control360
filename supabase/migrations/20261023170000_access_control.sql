-- ════════════════════════════════════════════════════════════════════════════
-- Bloque 2 · Acceso: empresa, sucursales, perfiles, roles, RLS, numeración.
-- Decisiones: docs/roadmap/08-decisiones-del-nucleo.md §1, §7, §8.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Auditoría: acciones derivadas de columnas ────────────────────────────────
/*
 * Amplía el trigger genérico de auditoría. tg_argv[1] admite ahora pares
 * "columna:acción" separados por coma. Si la columna cambia, la modificación se
 * registra con esa acción y severidad crítica. Casos especiales sin acción explícita:
 *   - sale_price → price_change
 *   - is_active  → deactivate / reactivate según el nuevo valor
 *   - otra       → update crítico
 */
create or replace function app.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_module   text := coalesce(tg_argv[0], 'general');
  v_rules    text[] := case when tg_nargs > 1 and tg_argv[1] <> ''
                            then string_to_array(tg_argv[1], ',') else '{}' end;
  v_rule     text;
  v_column   text;
  v_mapped   text;
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
    foreach v_rule in array v_rules loop
      v_column := trim(split_part(v_rule, ':', 1));
      v_mapped := nullif(trim(split_part(v_rule, ':', 2)), '');
      if v_old -> v_column is distinct from v_new -> v_column then
        v_severity := 'critical';
        v_action := case
          when v_mapped is not null then v_mapped::app.audit_action
          when v_column = 'sale_price' then 'price_change'
          when v_column = 'is_active' and (v_new ->> v_column)::boolean then 'reactivate'
          when v_column = 'is_active' then 'deactivate'
          else 'update'
        end;
        exit;
      end if;
    end loop;
  else
    v_old := to_jsonb(old);
    v_action := 'delete';
  end if;

  perform app.log_action(v_action, v_module, tg_table_schema || '.' || tg_table_name,
                         coalesce(v_new ->> 'id', v_old ->> 'id'), v_old, v_new, null, v_severity);

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

/* Fija el motivo de la operación en curso; lo toma la bitácora. */
create function app.set_reason(p_reason text)
returns void
language sql
set search_path = ''
as $$
  select set_config('app.reason', coalesce(trim(p_reason), ''), true);
$$;

/* Lanza un error de dominio (el código viaja en `hint`, ver src/lib/errors.ts). */
create function app.raise_domain(p_code text, p_message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception '%', p_message using errcode = 'P0001', hint = p_code;
end;
$$;

-- ── Roles ────────────────────────────────────────────────────────────────────

create type public.app_role as enum ('owner', 'admin', 'operator', 'viewer');
comment on type public.app_role is
  'owner: todo · admin: todo salvo propietarios · operator: operación diaria · viewer: solo lectura';

-- ── Empresa (fila única) ─────────────────────────────────────────────────────

create table public.company_settings (
  id                  boolean primary key default true check (id),
  name                text not null default 'Grupo Pecuario'
                        check (char_length(trim(name)) between 2 and 120),
  legal_name          text check (char_length(legal_name) <= 200),
  tax_id              text check (char_length(tax_id) <= 30),
  phone               text check (char_length(phone) <= 40),
  address             text check (char_length(address) <= 300),
  currency            char(3) not null default 'BOB',
  timezone            text not null default 'America/La_Paz',
  backdate_limit_days integer not null default 31 check (backdate_limit_days between 0 and 365),
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid
);
comment on table public.company_settings is 'Datos de la empresa. Una sola fila por despliegue (ADR 0001).';

insert into public.company_settings (id, created_at, updated_at) values (true, now(), now());

-- ── Perfiles ─────────────────────────────────────────────────────────────────

create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete restrict,
  email               text not null,
  full_name           text not null default '' check (char_length(full_name) <= 120),
  phone               text check (char_length(phone) <= 40),
  role                public.app_role not null default 'viewer',
  is_active           boolean not null default true,
  deactivated_at      timestamptz,
  deactivated_by      uuid,
  deactivation_reason text,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid,
  constraint profiles_deactivation_reason check (is_active or deactivation_reason is not null)
);
comment on table public.profiles is
  'Usuario de la app. Nunca se borra: se desactiva con motivo. `on delete restrict` protege el historial.';
create index profiles_role_idx on public.profiles (role) where is_active;

-- ── Sucursales ───────────────────────────────────────────────────────────────

create table public.branches (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(trim(name)) between 2 and 80),
  city                text check (char_length(city) <= 80),
  address             text check (char_length(address) <= 300),
  phone               text check (char_length(phone) <= 40),
  is_active           boolean not null default true,
  deactivated_at      timestamptz,
  deactivated_by      uuid,
  deactivation_reason text,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid,
  constraint branches_deactivation_reason check (is_active or deactivation_reason is not null)
);
create unique index branches_name_key on public.branches (lower(trim(name)));

insert into public.branches (name, created_at, updated_at) values ('Sucursal principal', now(), now());

/* Restricción opcional de un usuario a ciertas sucursales (sin filas = todas). */
create table public.user_branches (
  user_id    uuid not null references public.profiles (id),
  branch_id  uuid not null references public.branches (id),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  primary key (user_id, branch_id)
);

-- ── Funciones de acceso ──────────────────────────────────────────────────────

create function app.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active;
$$;

create function app.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active);
$$;

create function app.has_role(variadic p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(app.current_user_role() = any (p_roles), false);
$$;

create function app.require_role(variadic p_roles public.app_role[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    perform app.raise_domain('UNAUTHENTICATED', 'Sesión no válida');
  end if;
  if not app.has_role(variadic p_roles) then
    perform app.raise_domain('FORBIDDEN', 'No tienes permiso para realizar esta acción');
  end if;
end;
$$;

/* Propietarios y administradores ven todas; el resto, todas salvo restricción explícita. */
create function app.can_access_branch(p_branch uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_active_user() and (
    app.has_role('owner', 'admin')
    or not exists (select 1 from public.user_branches ub where ub.user_id = auth.uid())
    or exists (select 1 from public.user_branches ub
                where ub.user_id = auth.uid() and ub.branch_id = p_branch)
  );
$$;

-- ── Alta automática de perfiles desde Supabase Auth ──────────────────────────

/*
 * Cada usuario de Auth tiene un perfil. El primer usuario del sistema es el propietario
 * (arranque); el resto empieza como `viewer` hasta que un propietario/administrador
 * le asigne un rol.
 */
create function app.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role := 'viewer';
begin
  if not exists (select 1 from public.profiles where role = 'owner' and is_active) then
    v_role := 'owner';
  end if;
  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''),
          left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), v_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_auth_user();

create function app.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function app.sync_auth_user_email();

/* Siempre debe quedar al menos un propietario activo. */
create function app.protect_last_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'owner' and old.is_active and (new.role <> 'owner' or not new.is_active)
     and not exists (select 1 from public.profiles
                      where role = 'owner' and is_active and id <> old.id) then
    perform app.raise_domain('CONFLICT', 'Debe quedar al menos un propietario activo');
  end if;
  return new;
end;
$$;

create trigger protect_last_owner
  before update of role, is_active on public.profiles
  for each row execute function app.protect_last_owner();

-- ── Metadatos y bitácora ─────────────────────────────────────────────────────

select app.enable_tracking('public.company_settings', 'settings',
                           'name,timezone,backdate_limit_days,currency');
select app.enable_tracking('public.profiles', 'security', 'role:role_change,is_active');
select app.enable_tracking('public.branches', 'settings', 'is_active');

create trigger audit_row_change
  after insert or delete on public.user_branches
  for each row execute function app.audit_row_change('security');

-- ── Numeración de documentos ─────────────────────────────────────────────────

create table app.document_sequences (
  doc_type   text not null check (doc_type ~ '^[a-z_]+$'),
  scope      text not null default '',     -- '' = global; o id de sucursal/inventario
  last_value bigint not null check (last_value > 0),
  updated_at timestamptz not null default now(),
  primary key (doc_type, scope)
);
alter table app.document_sequences enable row level security;
revoke all on table app.document_sequences from public, anon, authenticated;

/*
 * Siguiente número correlativo. La fila queda bloqueada hasta el fin de la transacción,
 * así que dos operaciones simultáneas nunca obtienen el mismo número, y si la transacción
 * falla el número no se consume.
 */
create function app.next_document_number(p_doc_type text, p_scope text default '')
returns bigint
language sql
security definer
set search_path = ''
as $$
  insert into app.document_sequences as s (doc_type, scope, last_value)
  values (p_doc_type, coalesce(p_scope, ''), 1)
  on conflict (doc_type, scope)
    do update set last_value = s.last_value + 1, updated_at = now()
  returning last_value;
$$;
revoke all on function app.next_document_number from public, anon, authenticated;

-- ── Privilegios y RLS ────────────────────────────────────────────────────────

revoke all on table public.company_settings, public.profiles, public.branches, public.user_branches
  from public, anon, authenticated;

alter table public.company_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.user_branches enable row level security;

-- Empresa: todos los usuarios activos leen; propietario y administrador editan.
grant select on public.company_settings to authenticated;
grant update (name, legal_name, tax_id, phone, address, timezone, backdate_limit_days)
  on public.company_settings to authenticated;
create policy company_settings_select on public.company_settings
  for select to authenticated using (app.is_active_user());
create policy company_settings_update on public.company_settings
  for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

-- Perfiles: todos los activos leen (para mostrar autores); cada uno edita su nombre y teléfono.
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
create policy profiles_select on public.profiles
  for select to authenticated using (app.is_active_user());
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() and app.is_active_user())
  with check (id = auth.uid());

-- Sucursales: todos los activos leen; propietario y administrador crean y editan.
-- Activar/desactivar solo mediante public.set_branch_active (exige motivo).
grant select on public.branches to authenticated;
grant insert (name, city, address, phone) on public.branches to authenticated;
grant update (name, city, address, phone) on public.branches to authenticated;
create policy branches_select on public.branches
  for select to authenticated using (app.is_active_user());
create policy branches_insert on public.branches
  for insert to authenticated with check (app.has_role('owner', 'admin'));
create policy branches_update on public.branches
  for update to authenticated
  using (app.has_role('owner', 'admin')) with check (app.has_role('owner', 'admin'));

-- Restricciones de sucursal: lectura propia o de administración; escritura por RPC.
grant select on public.user_branches to authenticated;
create policy user_branches_select on public.user_branches
  for select to authenticated
  using (app.is_active_user() and (user_id = auth.uid() or app.has_role('owner', 'admin')));

-- ── API (RPC) ────────────────────────────────────────────────────────────────

/* Nombre comercial para la pantalla de inicio de sesión (sin sesión). */
create function public.public_company_info()
returns table (name text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name from public.company_settings c;
$$;

/* Registra el inicio de sesión del usuario actual en la bitácora. */
create function public.log_sign_in()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    perform app.raise_domain('UNAUTHENTICATED', 'Sesión no válida');
  end if;
  perform app.log_action('login', 'security', 'auth.users', auth.uid()::text);
end;
$$;

/* Valida que el usuario actual pueda administrar al usuario objetivo. */
create function app.assert_can_manage_user(p_user uuid, p_new_role public.app_role default null)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.profiles;
begin
  perform app.require_role('owner', 'admin');
  if p_user = auth.uid() then
    perform app.raise_domain('FORBIDDEN', 'No puedes cambiar tu propio rol ni desactivarte');
  end if;
  select * into v_target from public.profiles where id = p_user for update;
  if not found then
    perform app.raise_domain('NOT_FOUND', 'Usuario no encontrado');
  end if;
  if app.current_user_role() = 'admin' and (v_target.role = 'owner' or p_new_role = 'owner') then
    perform app.raise_domain('FORBIDDEN', 'Solo un propietario puede gestionar propietarios');
  end if;
  return v_target;
end;
$$;

create function public.admin_set_user_role(p_user uuid, p_role public.app_role, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.profiles;
begin
  v_target := app.assert_can_manage_user(p_user, p_role);
  if v_target.role = p_role then
    return;
  end if;
  perform app.set_reason(p_reason);
  update public.profiles set role = p_role where id = p_user;
end;
$$;

create function public.admin_set_user_active(p_user uuid, p_active boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.profiles;
begin
  v_target := app.assert_can_manage_user(p_user);
  if v_target.is_active = p_active then
    return;
  end if;
  if not p_active and char_length(trim(coalesce(p_reason, ''))) < 3 then
    perform app.raise_domain('VALIDATION', 'Indica el motivo de la desactivación');
  end if;
  perform app.set_reason(p_reason);
  update public.profiles
     set is_active = p_active,
         deactivated_at = case when p_active then null else now() end,
         deactivated_by = case when p_active then null else auth.uid() end,
         deactivation_reason = case when p_active then null else trim(p_reason) end
   where id = p_user;
end;
$$;

create function public.admin_set_user_branches(p_user uuid, p_branches uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform app.assert_can_manage_user(p_user);
  if exists (select 1 from unnest(coalesce(p_branches, '{}')) b
              where not exists (select 1 from public.branches where id = b)) then
    perform app.raise_domain('VALIDATION', 'Alguna sucursal no existe');
  end if;
  delete from public.user_branches
   where user_id = p_user and branch_id <> all (coalesce(p_branches, '{}'));
  insert into public.user_branches (user_id, branch_id)
  select p_user, b from unnest(coalesce(p_branches, '{}')) b
  on conflict do nothing;
end;
$$;

/* Listado de usuarios para administración, con datos de Auth (último ingreso, invitación). */
create function public.admin_list_users()
returns table (
  id uuid, email text, full_name text, phone text, role public.app_role, is_active boolean,
  deactivated_at timestamptz, deactivation_reason text, invited_at timestamptz,
  last_sign_in_at timestamptz, created_at timestamptz, branch_ids uuid[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.require_role('owner', 'admin');
  return query
    select p.id, p.email, p.full_name, p.phone, p.role, p.is_active, p.deactivated_at,
           p.deactivation_reason, u.invited_at, u.last_sign_in_at, p.created_at,
           coalesce((select array_agg(ub.branch_id order by ub.branch_id)
                       from public.user_branches ub where ub.user_id = p.id), '{}')
      from public.profiles p
      join auth.users u on u.id = p.id
     order by p.is_active desc, p.full_name, p.email;
end;
$$;

create function public.set_branch_active(p_branch uuid, p_active boolean, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current boolean;
begin
  perform app.require_role('owner', 'admin');
  select is_active into v_current from public.branches where id = p_branch for update;
  if not found then
    perform app.raise_domain('NOT_FOUND', 'Sucursal no encontrada');
  end if;
  if v_current = p_active then
    return;
  end if;
  if not p_active then
    if char_length(trim(coalesce(p_reason, ''))) < 3 then
      perform app.raise_domain('VALIDATION', 'Indica el motivo de la desactivación');
    end if;
    if not exists (select 1 from public.branches where is_active and id <> p_branch) then
      perform app.raise_domain('CONFLICT', 'Debe quedar al menos una sucursal activa');
    end if;
  end if;
  perform app.set_reason(p_reason);
  update public.branches
     set is_active = p_active,
         deactivated_at = case when p_active then null else now() end,
         deactivated_by = case when p_active then null else auth.uid() end,
         deactivation_reason = case when p_active then null else trim(p_reason) end
   where id = p_branch;
end;
$$;

/* Consulta de la bitácora (propietario y administrador), paginada por id descendente. */
create function public.audit_log_search(
  p_from          timestamptz default null,
  p_to            timestamptz default null,
  p_only_critical boolean default false,
  p_module        text default null,
  p_action        text default null,
  p_actor         uuid default null,
  p_entity_id     text default null,
  p_before_id     bigint default null,
  p_limit         integer default 50
)
returns table (
  id bigint, occurred_at timestamptz, actor_id uuid, actor_name text, action text,
  severity text, module text, entity text, entity_id text, reason text,
  old_data jsonb, new_data jsonb, changed_fields text[], context jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform app.require_role('owner', 'admin');
  return query
    select l.id, l.occurred_at, l.actor_id,
           coalesce(nullif(p.full_name, ''), p.email, 'Sistema'),
           l.action::text, l.severity::text, l.module, l.entity, l.entity_id, l.reason,
           l.old_data, l.new_data, l.changed_fields, l.context
      from app.audit_log l
      left join public.profiles p on p.id = l.actor_id
     where (p_from is null or l.occurred_at >= p_from)
       and (p_to is null or l.occurred_at < p_to)
       and (not p_only_critical or l.severity = 'critical')
       and (p_module is null or l.module = p_module)
       and (p_action is null or l.action::text = p_action)
       and (p_actor is null or l.actor_id = p_actor)
       and (p_entity_id is null or l.entity_id = p_entity_id)
       and (p_before_id is null or l.id < p_before_id)
     order by l.id desc
     limit least(greatest(coalesce(p_limit, 50), 1), 200);
end;
$$;

-- Ejecución: solo usuarios autenticados (la función decide el rol).
revoke execute on function
  public.log_sign_in(),
  public.admin_set_user_role(uuid, public.app_role, text),
  public.admin_set_user_active(uuid, boolean, text),
  public.admin_set_user_branches(uuid, uuid[]),
  public.admin_list_users(),
  public.set_branch_active(uuid, boolean, text),
  public.audit_log_search(timestamptz, timestamptz, boolean, text, text, uuid, text, bigint, integer)
  from public, anon;
grant execute on function
  public.log_sign_in(),
  public.admin_set_user_role(uuid, public.app_role, text),
  public.admin_set_user_active(uuid, boolean, text),
  public.admin_set_user_branches(uuid, uuid[]),
  public.admin_list_users(),
  public.set_branch_active(uuid, boolean, text),
  public.audit_log_search(timestamptz, timestamptz, boolean, text, text, uuid, text, bigint, integer)
  to authenticated;

revoke execute on function public.public_company_info() from public;
grant execute on function public.public_company_info() to anon, authenticated;
