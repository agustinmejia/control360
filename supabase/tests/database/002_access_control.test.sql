begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(47);

-- Estado inicial conocido, independiente de la semilla local y de otras pruebas.
-- (Todo se revierte con el ROLLBACK final.)
delete from public.user_branches;
delete from public.profiles;
delete from auth.identities;
delete from auth.users;
delete from public.branches where name <> 'Sucursal principal';
update public.branches set is_active = true, deactivation_reason = null;
update public.company_settings set name = 'Grupo Pecuario';

-- Identidades de prueba ---------------------------------------------------------
-- O = propietario (primer usuario), A = administrador, P = operador, V = consulta
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'duena@example.com', '{"full_name":"Dueña"}'),
  ('a0000000-0000-0000-0000-000000000002', 'admin@example.com', '{"full_name":"Admin"}'),
  ('a0000000-0000-0000-0000-000000000003', 'operador@example.com', '{"full_name":"Operador"}'),
  ('a0000000-0000-0000-0000-000000000004', 'consulta@example.com', '{"full_name":"Consulta"}');

-- Alta automática de perfiles ---------------------------------------------------
select is((select role::text from profiles where id = 'a0000000-0000-0000-0000-000000000001'),
  'owner', 'el primer usuario es propietario');
select is((select role::text from profiles where id = 'a0000000-0000-0000-0000-000000000002'),
  'viewer', 'los siguientes usuarios empiezan como consulta');
select is((select full_name from profiles where id = 'a0000000-0000-0000-0000-000000000003'),
  'Operador', 'el nombre se toma de los metadatos de la invitación');

-- Propietario asigna roles ------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ select admin_set_user_role('a0000000-0000-0000-0000-000000000002', 'admin', 'Encargada de oficina') $$,
  'el propietario asigna el rol de administrador');
select lives_ok($$ select admin_set_user_role('a0000000-0000-0000-0000-000000000003', 'operator') $$,
  'el propietario asigna el rol de operador');
select throws_ok($$ select admin_set_user_role('a0000000-0000-0000-0000-000000000001', 'viewer') $$,
  'P0001', null, 'nadie cambia su propio rol');
reset role;

select is((select action::text || '/' || severity::text || '/' || reason from app.audit_log
            where entity = 'public.profiles' and entity_id = 'a0000000-0000-0000-0000-000000000002'
            order by id desc limit 1),
  'role_change/critical/Encargada de oficina', 'el cambio de rol queda en la bitácora como crítico');
select is((select old_data ->> 'role' from app.audit_log
            where entity_id = 'a0000000-0000-0000-0000-000000000002' order by id desc limit 1),
  'viewer', 'la bitácora guarda el rol anterior');

-- Reglas del administrador ------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$ select admin_set_user_role('a0000000-0000-0000-0000-000000000003', 'owner') $$,
  'P0001', null, 'un administrador no puede crear propietarios');
select throws_ok($$ select admin_set_user_role('a0000000-0000-0000-0000-000000000001', 'admin') $$,
  'P0001', null, 'un administrador no puede cambiar a un propietario');
select lives_ok($$ select admin_set_user_role('a0000000-0000-0000-0000-000000000004', 'viewer') $$,
  'asignar el mismo rol no hace nada');
select is((select count(*)::int from admin_list_users()), 4, 'el administrador lista los usuarios');
reset role;

-- El operador no administra usuarios --------------------------------------------
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$ select admin_set_user_role('a0000000-0000-0000-0000-000000000004', 'operator') $$,
  'P0001', null, 'el operador no cambia roles');
select throws_ok($$ select * from admin_list_users() $$, 'P0001', null, 'el operador no lista usuarios con datos de Auth');
select throws_ok($$ select * from audit_log_search() $$, 'P0001', null, 'el operador no consulta la bitácora');
select is((select count(*)::int from profiles), 4, 'el operador ve los nombres de los usuarios');

-- Cada uno edita su nombre y teléfono, no su rol
select lives_ok($$ update profiles set full_name = 'Operador Uno', phone = '70000000'
                    where id = 'a0000000-0000-0000-0000-000000000003' $$, 'edita su propio perfil');
select is_empty($$ update profiles set full_name = 'X' where id = 'a0000000-0000-0000-0000-000000000004' returning 1 $$,
  'no edita el perfil de otra persona');
select throws_ok($$ update profiles set role = 'owner' where id = 'a0000000-0000-0000-0000-000000000003' $$,
  '42501', null, 'no puede cambiarse el rol directamente');

-- Empresa: solo propietario y administrador
select is_empty($$ update company_settings set name = 'Otra' returning 1 $$,
  'el operador no modifica la empresa');
select is((select name from company_settings), 'Grupo Pecuario', 'el operador lee los datos de la empresa');

-- Inicio de sesión registrado
select lives_ok($$ select log_sign_in() $$, 'registra el inicio de sesión');
reset role;
select is((select action::text from app.audit_log order by id desc limit 1), 'login', 'el ingreso queda en la bitácora');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ update company_settings set name = 'Grupo Pecuario SRL', backdate_limit_days = 15 $$,
  'el administrador modifica la empresa');
select throws_ok($$ update company_settings set currency = 'USD' $$, '42501', null, 'la moneda no se puede cambiar');
reset role;
select is((select severity::text from app.audit_log where entity = 'public.company_settings' order by id desc limit 1),
  'critical', 'cambiar el nombre o el límite de días es crítico');

-- Desactivación (borrado lógico) -------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$ select admin_set_user_active('a0000000-0000-0000-0000-000000000004', false) $$,
  'P0001', null, 'desactivar exige motivo');
select lives_ok($$ select admin_set_user_active('a0000000-0000-0000-0000-000000000004', false, 'Ya no trabaja aquí') $$,
  'el propietario desactiva un usuario con motivo');
reset role;
select is((select action::text || '/' || reason from app.audit_log
            where entity_id = 'a0000000-0000-0000-0000-000000000004' order by id desc limit 1),
  'deactivate/Ya no trabaja aquí', 'la desactivación queda en la bitácora con su motivo');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from profiles), 0, 'un usuario desactivado no ve datos aunque tenga sesión');
select is((select count(*)::int from company_settings), 0, 'un usuario desactivado no ve la empresa');
reset role;

-- Siempre queda un propietario activo
select throws_ok($$ update profiles set role = 'admin' where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'P0001', null, 'no se puede quitar el último propietario');

-- Nada se borra
select throws_ok($$ delete from auth.users where id = 'a0000000-0000-0000-0000-000000000003' $$,
  '23503', null, 'no se puede borrar un usuario que tiene perfil');

-- Anónimo -----------------------------------------------------------------------
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select throws_ok($$ select * from profiles $$, '42501', null, 'anónimo no lee perfiles');
select is((select name from public_company_info()), 'Grupo Pecuario SRL', 'anónimo ve solo el nombre comercial');
reset role;

-- Sucursales ----------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select lives_ok($$ insert into branches (name, city) values ('Trinidad', 'Trinidad') $$,
  'el administrador crea una sucursal');
select throws_ok($$ insert into branches (name) values ('trinidad ') $$, '23505', null,
  'no se repiten nombres de sucursal (sin distinguir mayúsculas)');
select throws_ok($$ select set_branch_active((select id from branches where name = 'Trinidad'), false) $$, 'P0001', null,
  'desactivar una sucursal exige motivo');
select lives_ok($$ select admin_set_user_branches('a0000000-0000-0000-0000-000000000003',
                     array[(select id from branches where name = 'Trinidad')]) $$,
  'se restringe al operador a una sucursal');
reset role;

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$ insert into branches (name) values ('Riberalta') $$, '42501', null, 'el operador no crea sucursales');
select ok(app.can_access_branch((select id from branches where name = 'Trinidad')), 'el operador accede a su sucursal');
select ok(not app.can_access_branch((select id from branches where name = 'Sucursal principal')),
  'el operador restringido no accede a otras sucursales');
reset role;

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select ok(app.can_access_branch((select id from branches where name = 'Sucursal principal')),
  'el administrador accede a todas las sucursales');
select lives_ok($$ select set_branch_active((select id from branches where name = 'Trinidad'), false, 'Cierre temporal') $$,
  'se desactiva una sucursal con motivo');
select throws_ok($$ select set_branch_active((select id from branches where name = 'Sucursal principal'), false, 'Prueba') $$,
  'P0001', null, 'debe quedar al menos una sucursal activa');
select ok((select count(*) from audit_log_search(p_only_critical => true)) >= 3,
  'el administrador filtra las acciones críticas de la bitácora');
reset role;

-- Numeración ----------------------------------------------------------------------
select is(array[app.next_document_number('sale'), app.next_document_number('sale'),
                app.next_document_number('sale', 'trinidad'), app.next_document_number('purchase')],
  array[1, 2, 1, 1]::bigint[], 'numeración correlativa por tipo de documento y ámbito');

select * from finish();
rollback;
