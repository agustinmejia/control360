-- Invariantes que deben cumplir TODAS las tablas y funciones, presentes y futuras.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(4);

select is_empty($$
  select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'app') and c.relkind in ('r', 'p') and not c.relrowsecurity
$$, 'todas las tablas de public y app tienen RLS habilitado');

select is_empty($$
  select table_name || ':' || privilege_type from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon'
$$, 'el rol anónimo no tiene privilegios sobre ninguna tabla');

select is_empty($$
  select n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'app') and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
$$, 'toda función security definer fija su search_path');

select is_empty($$
  select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef
     and has_function_privilege('anon', p.oid, 'execute')
     and p.proname not in ('public_company_info')
$$, 'el rol anónimo solo ejecuta las funciones públicas permitidas');

select * from finish();
rollback;
