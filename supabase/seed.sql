-- ════════════════════════════════════════════════════════════════════════════
-- Datos de DESARROLLO LOCAL. Nunca se aplica en staging ni producción
-- (`supabase db push` no ejecuta este archivo).
--
-- Usuarios de prueba (contraseña de todos: Control360dev):
--   propietario@control360.test  · Propietario (primer usuario)
--   admin@control360.test        · Administrador
--   operador@control360.test     · Operador
--   consulta@control360.test     · Consulta
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare
  v_user record;
begin
  for v_user in
    select * from (values
      ('00000000-0000-4000-8000-000000000001'::uuid, 'propietario@control360.test', 'Paola Propietaria', 'owner'),
      ('00000000-0000-4000-8000-000000000002'::uuid, 'admin@control360.test', 'Andrés Administrador', 'admin'),
      ('00000000-0000-4000-8000-000000000003'::uuid, 'operador@control360.test', 'Óscar Operador', 'operator'),
      ('00000000-0000-4000-8000-000000000004'::uuid, 'consulta@control360.test', 'Carla Consulta', 'viewer')
    ) as t(id, email, full_name, role)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user.id, 'authenticated', 'authenticated', v_user.email,
      extensions.crypt('Control360dev', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', v_user.full_name),
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    values (gen_random_uuid(), v_user.id, v_user.id::text,
            jsonb_build_object('sub', v_user.id::text, 'email', v_user.email, 'email_verified', true),
            'email', now(), now(), now());
    update public.profiles set role = v_user.role::public.app_role where id = v_user.id;
  end loop;

  insert into public.branches (name, city) values ('Sucursal Trinidad', 'Trinidad');
end;
$$;

-- ── Inventario de ejemplo ─────────────────────────────────────────────────────
do $$
declare
  v_trinidad uuid;
  v_main     uuid := (select id from public.inventories where name = 'Inventario principal');
  v_alimento uuid;
  v_kg       uuid;
  v_saco     uuid;
  v_sal      uuid;
  v_vacuna   uuid;
begin
  -- Las funciones de negocio exigen un usuario: se actúa como la propietaria de prueba.
  perform set_config('request.jwt.claims',
    '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

  insert into public.inventories (branch_id, name, description)
  select id, 'Tienda Trinidad', 'Venta al público' from public.branches where name = 'Sucursal Trinidad'
  returning id into v_trinidad;

  insert into public.product_categories (name) values ('Alimentos'), ('Insumos veterinarios'), ('Minerales');

  v_alimento := public.inv_create_product('Alimento balanceado engorde', (select id from public.units where code = 'kg'),
    (select id from public.product_categories where name = 'Alimentos'), null, 9.50, 'ALB-KG', 50);
  v_kg := (select id from public.product_variants where product_id = v_alimento and is_default);
  v_saco := public.inv_add_variant(v_alimento, 'Saco 40 kg', (select id from public.units where code = 'saco'), 40, 340, 'ALB-S40', 5);

  perform public.inv_create_product('Sal mineral 25 kg', (select id from public.units where code = 'bolsa'),
    (select id from public.product_categories where name = 'Minerales'), null, 185, 'SAL-25', 3);
  v_sal := (select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.name = 'Sal mineral 25 kg');

  perform public.inv_create_product('Vacuna antiaftosa 50 dosis', (select id from public.units where code = 'frasco'),
    (select id from public.product_categories where name = 'Insumos veterinarios'), null, 120, 'VAC-AF50', 2);
  v_vacuna := (select v.id from public.product_variants v join public.products p on p.id = v.product_id where p.name like 'Vacuna%');

  perform public.inv_post_opening(v_main, (now() at time zone 'America/La_Paz')::date - 10, jsonb_build_array(
    jsonb_build_object('variant_id', v_saco, 'quantity', 40, 'unit_cost', 290),
    jsonb_build_object('variant_id', v_kg, 'quantity', 35.5, 'unit_cost', 7.25),
    jsonb_build_object('variant_id', v_sal, 'quantity', 12, 'unit_cost', 150),
    jsonb_build_object('variant_id', v_vacuna, 'quantity', 8, 'unit_cost', 95)), 'Saldo inicial de prueba');
  perform public.inv_post_transfer(v_main, v_trinidad, (now() at time zone 'America/La_Paz')::date - 3,
    jsonb_build_array(jsonb_build_object('variant_id', v_saco, 'quantity', 10)), 'Reposición de tienda');
  perform public.inv_set_inventory_price(v_trinidad, v_saco, 355, 'Precio en Trinidad');
end;
$$;
