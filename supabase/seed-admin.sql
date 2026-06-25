-- =====================================================================
-- SUPER-ADMIN SEED  — run this in the Supabase SQL editor AFTER schema.sql
-- Creates a login + an admin agent profile so you can access the Admin Panel
-- at  https://admin.<yourdomain>/
--
--   Email:    admin@classicgroupoftravels.com
--   Password: ClassicAdmin@2026
--
-- IMPORTANT: change this password after your first login (Profile > Change
-- Password, or in Supabase > Authentication > Users).
-- =====================================================================

-- pgcrypto provides crypt()/gen_salt() for the password hash.
create extension if not exists pgcrypto;

do $$
declare
  uid uuid := gen_random_uuid();
  admin_email text := 'admin@classicgroupoftravels.com';
  admin_pass  text := 'ClassicAdmin@2026';
begin
  -- Skip if this email already exists as an auth user.
  if exists (select 1 from auth.users where email = admin_email) then
    raise notice 'Auth user % already exists — skipping creation.', admin_email;
    -- Make sure the matching agent row is an admin.
    update agents set role = 'admin', is_super_admin = true, status = 'active'
     where email = admin_email
        or auth_user_id = (select id from auth.users where email = admin_email);
    return;
  end if;

  -- 1) Create the GoTrue auth user (email + bcrypt password, pre-confirmed).
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    admin_email, crypt(admin_pass, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Super Admin"}'::jsonb,
    '', '', '', ''
  );

  -- 2) Identity row (required for email/password sign-in on recent Supabase).
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', admin_email),
    'email', now(), now(), now()
  );

  -- 3) App profile with the SUPER-admin role (the on_auth_user_created trigger
  --    may have already created a pending row, so upsert).
  insert into agents (auth_user_id, full_name, email, role, is_super_admin, status)
  values (uid, 'Super Admin', admin_email, 'admin', true, 'active')
  on conflict (auth_user_id) do update
    set role = 'admin', is_super_admin = true, status = 'active', full_name = excluded.full_name;

  raise notice 'Created super-admin %', admin_email;
end $$;

-- ---------------------------------------------------------------------
-- ALTERNATIVE / to promote an EXISTING account to admin, run just this:
--   update agents set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------
