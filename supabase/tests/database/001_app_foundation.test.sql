begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

-- Estructura
select has_schema('app');
select has_table('app', 'audit_log', 'existe la bitácora');
select ok(
  (select relrowsecurity from pg_class where oid = 'app.audit_log'::regclass),
  'la bitácora tiene RLS habilitado'
);

-- Tabla de prueba con la convención de columnas
create table public.tracking_probe (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sale_price numeric(14,2) not null default 0,
  created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid
);
select app.enable_tracking('public.tracking_probe', 'inventory', 'sale_price');

-- Simula un usuario autenticado y una solicitud HTTP
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select set_config('request.headers',
  '{"x-forwarded-for":"10.0.0.1, 10.0.0.2","user-agent":"pgtap"}', true);

insert into public.tracking_probe (id, name, sale_price, created_by)
values ('22222222-2222-2222-2222-222222222222', 'Sal mineral', 80,
        '99999999-9999-9999-9999-999999999999');

select is(
  (select created_by from public.tracking_probe),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'created_by lo fija el servidor, no el cliente'
);
select is(
  (select action::text || '/' || severity::text from app.audit_log
    where entity = 'public.tracking_probe' order by id desc limit 1),
  'create/normal',
  'el alta queda registrada como create/normal'
);
select is(
  (select actor_id from app.audit_log order by id desc limit 1),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'se registra el autor'
);
select is(
  (select context ->> 'ip' from app.audit_log order by id desc limit 1),
  '10.0.0.1',
  'se guarda la IP de origen'
);

-- Modificación normal: solo los campos cambiados, con valor previo
update public.tracking_probe set name = 'Sal mineral 25 kg';
select ok(
  (select 'name' = any (changed_fields) and not ('sale_price' = any (changed_fields))
     from app.audit_log order by id desc limit 1),
  'update guarda solo los campos modificados'
);
select is(
  (select old_data ->> 'name' from app.audit_log order by id desc limit 1),
  'Sal mineral',
  'update guarda el valor previo'
);

-- Update sin cambios reales: no se registra
update public.tracking_probe set name = name;
select is(
  (select count(*) from app.audit_log where entity = 'public.tracking_probe')::int,
  2,
  'un update sin cambios no genera registro'
);

-- Cambio de precio: crítico, con motivo de sesión
select set_config('app.reason', 'Nueva lista de precios', true);
update public.tracking_probe set sale_price = 95;
select is(
  (select action::text || '/' || severity::text || '/' || reason from app.audit_log
    order by id desc limit 1),
  'price_change/critical/Nueva lista de precios',
  'el cambio de precio es crítico y lleva motivo'
);
select set_config('app.reason', '', true);

-- Borrado físico: queda como crítico
delete from public.tracking_probe;
select is(
  (select action::text || '/' || severity::text from app.audit_log order by id desc limit 1),
  'delete/critical',
  'un borrado físico se registra como crítico'
);

-- Acciones de negocio registradas por funciones
select ok(
  app.log_action('void', 'sales', 'sale', 'V-1', null, null, 'Error de digitación') > 0,
  'log_action devuelve el id'
);
select is(
  (select severity::text from app.audit_log order by id desc limit 1),
  'critical',
  'una anulación es crítica por defecto'
);

-- Inmutabilidad
select throws_ok(
  $$ update app.audit_log set reason = 'x' $$,
  'P0001', null, 'la bitácora no se puede modificar'
);
select throws_ok(
  $$ delete from app.audit_log $$,
  'P0001', null, 'la bitácora no se puede borrar'
);

-- Un usuario autenticado no puede leer la bitácora directamente
set local role authenticated;
select throws_ok(
  $$ select count(*) from app.audit_log $$,
  '42501', null, 'authenticated no accede directamente a la bitácora'
);
reset role;

select * from finish();
rollback;
