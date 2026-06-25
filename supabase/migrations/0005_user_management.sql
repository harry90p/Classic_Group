-- =====================================================================
-- 0005_user_management.sql
-- Agent approval workflow + limited company admins + user management.
--
--  * Every new registration becomes a PENDING agent that the super-admin
--    must approve before the agent portal unlocks.
--  * Super-admin can grant ADMIN (limited) access to company-domain emails
--    so staff can work reservations / ticketing / holds.
--  * `is_super_admin` keeps the platform owner distinct from limited admins
--    while reusing the existing role = 'admin' permission checks.
-- =====================================================================

-- 1) Approval status + admin flag on agents -----------------------------
do $$ begin
  create type agent_status as enum ('pending','active','suspended','rejected');
exception when duplicate_object then null; end $$;

alter table agents add column if not exists status         agent_status not null default 'pending';
alter table agents add column if not exists is_super_admin boolean      not null default false;
alter table agents add column if not exists approved_at    timestamptz;
alter table agents add column if not exists approved_by    uuid references agents(id);

-- Don't lock out anyone who already had access before this upgrade.
update agents set status = 'active' where status = 'pending';

-- The seeded account is the platform owner (full super-admin).
update agents
   set is_super_admin = true, role = 'admin', status = 'active'
 where email = 'admin@classicgroupoftravels.com';

-- 2) Auto-create a PENDING agent profile whenever someone registers. -----
--    This is what surfaces the request to the super-admin for approval.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.agents (auth_user_id, full_name, email, whatsapp_number, role, status)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'whatsapp', ''),
    'agent',
    'pending'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
