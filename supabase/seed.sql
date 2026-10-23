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
