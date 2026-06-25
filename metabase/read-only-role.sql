-- Step 7: Metabase read-only access to Supabase Postgres.
-- Run this in the Supabase SQL editor, then connect Metabase with these creds.
-- Metabase only ever needs SELECT; never give it write access.

create role metabase_ro login password 'CHANGE_ME_STRONG_PASSWORD';

grant connect on database postgres to metabase_ro;
grant usage on schema public to metabase_ro;
grant select on all tables in schema public to metabase_ro;

-- Make future tables readable automatically.
alter default privileges in schema public
  grant select on tables to metabase_ro;
