begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(58);

-- ── Preparación (independiente de la semilla; todo se revierte) ───────────────
update public.company_settings set backdate_limit_days = 31, timezone = 'America/La_Paz';

insert into auth.users (id, email, raw_user_meta_data) values
  ('c0000000-0000-0000-0000-000000000001', 'inv-owner@example.com', '{"full_name":"Inv Owner"}'),
  ('c0000000-0000-0000-0000-000000000003', 'inv-operator@example.com', '{"full_name":"Inv Operador"}'),
  ('c0000000-0000-0000-0000-000000000004', 'inv-viewer@example.com', '{"full_name":"Inv Consulta"}');
update public.profiles set role = 'owner' where id = 'c0000000-0000-0000-0000-000000000001';
update public.profiles set role = 'operator' where id = 'c0000000-0000-0000-0000-000000000003';
update public.profiles set role = 'viewer' where id = 'c0000000-0000-0000-0000-000000000004';

insert into public.branches (id, name) values
  ('d0000000-0000-0000-0000-00000000000a', 'TEST Sucursal A'),
  ('d0000000-0000-0000-0000-00000000000b', 'TEST Sucursal B');
insert into public.inventories (id, branch_id, name) values
  ('e0000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-00000000000a', 'TEST Almacén A'),
  ('e0000000-0000-0000-0000-00000000000b', 'd0000000-0000-0000-0000-00000000000b', 'TEST Tienda B');
-- El operador solo trabaja en la sucursal A.
insert into public.user_branches (user_id, branch_id)
values ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-00000000000a');

create temporary table ids (key text primary key, id uuid) on commit drop;
grant all on ids to authenticated;

-- ── Catálogo ──────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

insert into ids values ('product', inv_create_product('TEST Alimento X', (select id from units where code = 'kg'),
  null, null, 9.5, 'TEST-ALX'));
select is((select count(*)::int from product_variants where product_id = (select id from ids where key = 'product')),
  1, 'crear un producto crea su presentación por defecto');
insert into ids select 'kg', id from product_variants where product_id = (select id from ids where key = 'product');
select is((select factor from product_variants where id = (select id from ids where key = 'kg')), 1.000000::numeric,
  'la presentación por defecto tiene factor 1');
insert into ids values ('saco', inv_add_variant((select id from ids where key = 'product'), 'Saco 40 kg',
  (select id from units where code = 'saco'), 40, 320));
select throws_ok($$ select inv_create_product('test alimento x', (select id from units where code = 'kg')) $$,
  'P0001', null, 'no se repite el nombre del producto');
select throws_ok($$ select inv_add_variant((select id from ids where key = 'product'), 'Mal', (select id from units where code = 'saco'), 0) $$,
  'P0001', null, 'el factor debe ser mayor a 0');
select throws_ok($$ update product_variants set factor = 50 where id = (select id from ids where key = 'saco') $$,
  '42501', null, 'el factor no se puede editar');

-- Saldo inicial hace 5 días: 10 sacos a 300
select lives_ok($$ select inv_post_opening('e0000000-0000-0000-0000-00000000000a', app.inv_today() - 5,
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 10, 'unit_cost', 300))) $$,
  'el propietario registra el saldo inicial');
reset role;

select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'saco')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 10.000::numeric, 'saldo inicial: 10 sacos');
select is((select last_unit_cost from stock_balances where variant_id = (select id from ids where key = 'saco')), 300.0000::numeric,
  'se guarda el último costo');

-- ── Operador ──────────────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
set local role authenticated;

select throws_ok($$ select inv_create_product('TEST Otro', (select id from units where code = 'kg')) $$,
  'P0001', null, 'el operador no crea productos');
select throws_ok($$ select inv_post_opening('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', null, 'el operador no registra saldos iniciales');

insert into ids values ('exit1', inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 3)),
  'Sacos rotos', 'f0000000-0000-0000-0000-000000000001'));
select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'saco')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 7.000::numeric, 'la salida descuenta: quedan 7');
select is((select unit_cost from inventory_movements where document_id = (select id from ids where key = 'exit1')),
  300.0000::numeric, 'la salida se valora al último costo');

-- Idempotencia: el mismo request no duplica
select is(inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 3)),
  'Sacos rotos', 'f0000000-0000-0000-0000-000000000001'), (select id from ids where key = 'exit1'),
  'reintentar con el mismo identificador devuelve el mismo documento');
select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'saco')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 7.000::numeric, 'y no descuenta dos veces');

-- Validaciones
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 8))) $$,
  'P0001', 'Stock insuficiente de TEST Alimento X · Saco 40 kg: hay 7', 'no se puede dejar stock negativo');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1.5))) $$,
  'P0001', null, 'los sacos se manejan en unidades enteras');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(), null,
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', 'Indica el motivo', 'la salida exige motivo');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'devolucion'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', 'Motivo no válido para esta operación', 'un motivo de entrada no sirve para una salida');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today() + 1,
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', 'No se permiten fechas futuras', 'no se aceptan fechas futuras');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today() - 40,
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', 'Solo se puede registrar hasta 31 días atrás', 'respeta el límite de días hacia atrás');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today() - 6,
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', null, 'una salida anterior al saldo inicial dejaría el historial negativo');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1),
                    jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', 'Un producto aparece más de una vez', 'no se repiten productos en un documento');

-- Fraccionamiento: 1 saco → 39,5 kg (merma 0,5 kg)
insert into ids values ('conv', inv_post_conversion('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from ids where key = 'saco'), 1, (select id from ids where key = 'kg'), 39.5));
select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'kg')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 39.500::numeric, 'el fraccionamiento suma 39,5 kg');
select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'saco')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 6.000::numeric, 'y descuenta 1 saco');
select is((select conversion_loss_base from inventory_documents where id = (select id from ids where key = 'conv')),
  0.500::numeric, 'registra la merma del fraccionamiento en kg');
select is((select unit_cost from inventory_movements where document_id = (select id from ids where key = 'conv') and direction = 1),
  7.5949::numeric, 'el costo por kg sale del costo del saco');
select throws_ok($$ select inv_post_conversion('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from ids where key = 'saco'), 1, (select id from ids where key = 'kg'), 41) $$,
  'P0001', null, 'no puede resultar más de lo que contenía el saco');
select is((select sum(base_quantity) from v_stock where product_id = (select id from ids where key = 'product')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 279.500::numeric,
  'el total del producto en kg suma todas las presentaciones (6×40 + 39,5)');

-- Traspaso a la sucursal B (el operador puede enviar aunque no vea B)
insert into ids values ('transfer', inv_post_transfer('e0000000-0000-0000-0000-00000000000a', 'e0000000-0000-0000-0000-00000000000b',
  app.inv_today(), jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 2))));
select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'saco')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 4.000::numeric, 'el traspaso descuenta del origen');
select is_empty($$ select 1 from stock_balances where inventory_id = 'e0000000-0000-0000-0000-00000000000b' $$,
  'el operador restringido no ve el stock de otra sucursal');
select throws_ok($$ select inv_post_adjustment('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'conteo_fisico'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'counted_quantity', 3))) $$,
  'P0001', null, 'el operador no registra ajustes');

-- Anular lo propio del día
insert into ids values ('void1', inv_void_document((select id from ids where key = 'exit1'), 'Se registró por error'));
select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'saco')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 7.000::numeric, 'anular la salida repone el stock');
select throws_ok($$ select inv_void_document((select id from ids where key = 'exit1'), 'Otra vez') $$,
  'P0001', 'El documento ya está anulado', 'no se anula dos veces');
select throws_ok($$ select inv_void_document((select id from inventory_documents where inventory_id = 'e0000000-0000-0000-0000-00000000000a'
  and document_type = 'opening' and created_by = 'c0000000-0000-0000-0000-000000000001'), 'No me gusta') $$,
  'P0001', null, 'el operador no anula saldos iniciales ajenos');
reset role;

select is((select status from inventory_documents where id = (select id from ids where key = 'exit1')), 'voided',
  'el documento original queda anulado');
select is((select reverses_document_id from inventory_documents where id = (select id from ids where key = 'void1')),
  (select id from ids where key = 'exit1'), 'el documento inverso apunta al original');
select is((select count(*)::int from inventory_movements where document_id = (select id from ids where key = 'exit1')),
  1, 'el movimiento original se conserva');

-- ── Propietario: stock en B, ajustes, anulaciones con stock comprometido ────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select is((select quantity from stock_balances where inventory_id = 'e0000000-0000-0000-0000-00000000000b'
            and variant_id = (select id from ids where key = 'saco')), 2.000::numeric, 'el destino recibe 2 sacos');
select is((select last_unit_cost from stock_balances where inventory_id = 'e0000000-0000-0000-0000-00000000000b'
            and variant_id = (select id from ids where key = 'saco')), 300.0000::numeric, 'al mismo costo del origen');
select is((select sum(quantity) from v_stock where variant_id = (select id from ids where key = 'saco')), 9.000::numeric,
  'el stock global suma todos los inventarios (7 + 2)');

select lives_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000b', app.inv_today(),
  (select id from movement_reasons where code = 'consumo_interno'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 2))) $$,
  'se consume lo recibido en B');
select throws_ok($$ select inv_void_document((select id from ids where key = 'transfer'), 'Error de destino') $$,
  'P0001', null, 'no se anula un traspaso cuya mercadería ya salió del destino');

insert into ids values ('adj', inv_post_adjustment('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'conteo_fisico'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'counted_quantity', 5)),
  'Conteo mensual'));
select is((select quantity from stock_balances where variant_id = (select id from ids where key = 'saco')
            and inventory_id = 'e0000000-0000-0000-0000-00000000000a'), 5.000::numeric, 'el ajuste deja el stock contado');
select is((select direction * quantity from inventory_movements where document_id = (select id from ids where key = 'adj')),
  -2.000::numeric, 'y registra solo la diferencia');
select throws_ok($$ select inv_post_adjustment('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'conteo_fisico'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'counted_quantity', 5))) $$,
  'P0001', null, 'un ajuste sin diferencias se rechaza');

-- Precios
select lives_ok($$ select inv_set_base_price((select id from ids where key = 'saco'), 330, 'Nueva lista') $$,
  'cambia el precio base con motivo');
select lives_ok($$ select inv_set_inventory_price('e0000000-0000-0000-0000-00000000000b', (select id from ids where key = 'saco'), 350, 'Precio Trinidad') $$,
  'fija un precio propio para un inventario');
select is((select unit_price from v_stock where inventory_id = 'e0000000-0000-0000-0000-00000000000b'
            and variant_id = (select id from ids where key = 'saco')), 350.00::numeric, 'el inventario usa su precio propio');
select is((select unit_price from v_stock where inventory_id = 'e0000000-0000-0000-0000-00000000000a'
            and variant_id = (select id from ids where key = 'saco')), 330.00::numeric, 'los demás usan el precio base');
select is((select old_price::text || '→' || new_price::text || ' ' || reason from price_changes
            where variant_id = (select id from ids where key = 'saco') and inventory_id is null order by id desc limit 1),
  '320.00→330.00 Nueva lista', 'el historial de precios guarda el cambio y el motivo');

-- Kardex
select is((select balance from v_kardex where inventory_id = 'e0000000-0000-0000-0000-00000000000a'
            and variant_id = (select id from ids where key = 'saco') order by movement_date desc, id desc limit 1),
  5.000::numeric, 'el saldo acumulado del kardex coincide con la existencia');
reset role;

-- ── Consulta: ve, no registra ────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select ok((select count(*) from v_stock where variant_id = (select id from ids where key = 'saco')) = 2,
  'consulta ve las existencias de todas las sucursales');
select throws_ok($$ select inv_post_exit('e0000000-0000-0000-0000-00000000000a', app.inv_today(),
  (select id from movement_reasons where code = 'merma'),
  jsonb_build_array(jsonb_build_object('variant_id', (select id from ids where key = 'saco'), 'quantity', 1))) $$,
  'P0001', null, 'consulta no registra movimientos');
select throws_ok($$ insert into stock_balances (inventory_id, variant_id, quantity)
  values ('e0000000-0000-0000-0000-00000000000a', (select id from ids where key = 'kg'), 100) $$,
  '42501', null, 'nadie escribe saldos directamente');
reset role;

-- ── Inmutabilidad y bitácora ─────────────────────────────────────────────────
select throws_ok($$ update inventory_movements set quantity = 1 $$, 'P0001', null, 'los movimientos no se modifican');
select throws_ok($$ delete from inventory_documents where id = (select id from ids where key = 'adj') $$,
  'P0001', null, 'los documentos no se borran');
select is((select action::text || '/' || severity::text from app.audit_log
            where entity_id = (select id::text from ids where key = 'adj') order by id desc limit 1),
  'adjust/critical', 'el ajuste queda en la bitácora como crítico');
select is((select action::text || '/' || reason from app.audit_log
            where entity_id = (select id::text from ids where key = 'exit1') order by id desc limit 1),
  'void/Se registró por error', 'la anulación queda en la bitácora con su motivo');

select * from finish();
rollback;
