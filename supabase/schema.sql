-- Classic Travels Rebuild — Postgres schema (Supabase)
-- Step 2: Database Schema & Data Model
-- Metabase reads these tables directly; group bookings are auto-recorded.

create extension if not exists "pgcrypto";

-- Agents
create type agent_role as enum ('agent', 'sub_agent', 'admin');

create table if not exists agents (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique,                 -- maps to auth.users.id
  full_name       text not null,
  email           text not null,               -- registered email (reminders)
  whatsapp_number text,                         -- registered WhatsApp (reminders)
  role            agent_role not null default 'agent',
  parent_agent_id uuid references agents(id),
  external_ref    text unique,                  -- maps a polled source's agent id (Step 5)
  created_at      timestamptz not null default now()
);

-- Group bookings
create type booking_status as enum ('draft','quoted','reserved','ticketed','expired','cancelled');

create table if not exists group_bookings (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references agents(id),
  reference    text unique,
  airline      text,
  origin       text,
  destination  text,
  travel_date  date,
  pax_count    int  not null default 0,
  status       booking_status not null default 'draft',
  fare_total   numeric(12,2),
  currency     text default 'PKR',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Passengers (fixes the 500-error form)
create table if not exists passengers (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references group_bookings(id) on delete cascade,
  title       text,
  first_name  text not null,
  last_name   text not null,
  pax_type    text not null default 'ADT',  -- ADT/CHD/INF
  dob         date,
  passport_no text,
  passport_expiry date,
  nationality text,
  created_at  timestamptz not null default now()
);

-- PNRs
create type pnr_status as enum ('pending','ticketed','expired','cancelled');

create table if not exists pnrs (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid references group_bookings(id) on delete set null,
  agent_id      uuid references agents(id),       -- nullable: polled rows may not map to an agent yet
  pnr_code      text not null,
  airline       text,
  status        pnr_status not null default 'pending',
  source        text not null default 'manual',   -- 'manual' | 'amadeus' | 'portal' (Step 5)
  booking_at    timestamptz,
  issuance_at   timestamptz,
  expiry_at     timestamptz,             -- ticketing time limit (TTL)
  last_synced_at timestamptz,
  created_at    timestamptz not null default now(),
  unique (source, pnr_code)              -- dedup key for the pluggable sync layer
);
create index if not exists idx_pnrs_expiry on pnrs (expiry_at) where status = 'pending';

-- Reminders (idempotent)
create type reminder_channel as enum ('email','whatsapp');
create type reminder_window  as enum ('T-48h','T-24h');
create type reminder_state   as enum ('scheduled','sent','failed');

create table if not exists reminders (
  id          uuid primary key default gen_random_uuid(),
  pnr_id          uuid not null references pnrs(id) on delete cascade,
  reminder_window reminder_window not null,
  channel         reminder_channel not null,
  state       reminder_state not null default 'scheduled',
  sent_at     timestamptz,
  error       text,
  created_at  timestamptz not null default now(),
  unique (pnr_id, reminder_window, channel)   -- guarantees no duplicate alerts
);
create index if not exists idx_reminders_state on reminders (state);

-- Ledger / financials
create table if not exists ledger (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references agents(id),
  booking_id  uuid references group_bookings(id),
  entry_type  text not null,            -- payment / commission / adjustment
  amount      numeric(12,2) not null,
  currency    text default 'PKR',
  note        text,
  created_at  timestamptz not null default now()
);

-- In-app notifications
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  agent_id    uuid not null references agents(id),
  title       text not null,
  body        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- Row Level Security (agents see only their own data)
alter table group_bookings enable row level security;
alter table pnrs           enable row level security;
alter table notifications  enable row level security;
alter table ledger         enable row level security;

create policy own_bookings on group_bookings
  for all using (agent_id in (select id from agents where auth_user_id = auth.uid()));
create policy own_pnrs on pnrs
  for all using (agent_id in (select id from agents where auth_user_id = auth.uid()));
create policy own_notifications on notifications
  for all using (agent_id in (select id from agents where auth_user_id = auth.uid()));
create policy own_ledger on ledger
  for all using (agent_id in (select id from agents where auth_user_id = auth.uid()));

-- Announcements / newsletter (shown on the agent dashboard, pop up on login)
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  level       text not null default 'info',   -- info | warning | payment
  audience    text not null default 'all',    -- all | role:agent | agent:<uuid>
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,                     -- null = no expiry
  created_by  uuid references agents(id),
  created_at  timestamptz not null default now()
);
create index if not exists idx_announcements_window on announcements (starts_at, ends_at);

-- Per-agent read/dismiss tracking so the popup only nags until acknowledged
create table if not exists announcement_reads (
  announcement_id uuid not null references announcements(id) on delete cascade,
  agent_id        uuid not null references agents(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (announcement_id, agent_id)
);

alter table announcements      enable row level security;
alter table announcement_reads enable row level security;

-- Any authenticated agent may read announcements (audience is filtered in-app).
create policy read_announcements on announcements
  for select using (true);
-- Admins may post announcements.
create policy admin_write_announcements on announcements
  for all using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));
-- Agents manage only their own read receipts.
create policy own_reads on announcement_reads
  for all using (agent_id in (select id from agents where auth_user_id = auth.uid()));

-- NOTE: the cron watcher uses the service-role key, which bypasses RLS.


-- =====================================================================
-- Agent service / custom-package requests  (Admin Panel workflow)
-- Agents create these from their portal; admins process them in /admin.
-- =====================================================================
create type request_type   as enum ('custom_package','visa','ticket','hotel','transport','insurance','ziyarat','tour','other');
create type request_status as enum ('submitted','under_review','approved','rejected','processing','completed','cancelled');

create table if not exists requests (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references agents(id) on delete cascade,
  request_type  request_type not null default 'custom_package',
  title         text not null,
  destination   text,
  client_name   text,
  client_phone  text,
  pax_count     int default 1,
  departure_date date,
  return_date    date,
  nights        int,
  hotel         text,
  transport     text,
  inclusions    text,                         -- free text / comma list
  budget        numeric(12,2),
  currency      text default 'PKR',
  notes         text,
  status        request_status not null default 'submitted',
  admin_notes   text,                         -- admin's processing notes
  processed_by  uuid references agents(id),
  processed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_requests_status on requests (status);
create index if not exists idx_requests_agent  on requests (agent_id);

alter table requests enable row level security;
-- Agents read + create only their own requests.
create policy own_requests_select on requests
  for select using (agent_id in (select id from agents where auth_user_id = auth.uid()));
create policy own_requests_insert on requests
  for insert with check (agent_id in (select id from agents where auth_user_id = auth.uid()));
-- Admins may read / update / delete every request.
create policy admin_all_requests on requests
  for all using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));

-- ---------------------------------------------------------------------
-- Admin read access for the Admin Panel overviews (PNRs + bookings).
-- Agents still only see their own rows (own_* policies above); these add
-- an OR branch so admins can see everything across the workspace.
-- ---------------------------------------------------------------------
create policy admin_read_pnrs on pnrs
  for select using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));
create policy admin_read_bookings on group_bookings
  for select using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));
create policy admin_read_ledger on ledger
  for select using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));


-- =====================================================================
-- Group Booking Lifecycle (also shipped as migrations/0002 for live DBs)
-- Submitted -> Reserved (PNR + ticketing time limit) -> Issued (e-ticket).
-- =====================================================================
alter type request_status add value if not exists 'reserved';
alter type request_status add value if not exists 'issued';
alter type pnr_status     add value if not exists 'reserved';
alter type pnr_status     add value if not exists 'issued';

create sequence if not exists agent_serial_seq start 1;
alter table agents add column if not exists agent_code         text unique;
alter table agents add column if not exists virtual_account_no text unique;
alter table agents add column if not exists virtual_iban       text;

create or replace function assign_agent_identity() returns trigger as $$
declare s bigint;
begin
  if new.agent_code is null or new.virtual_account_no is null then
    s := nextval('agent_serial_seq');
    if new.agent_code is null then new.agent_code := lpad(s::text, 5, '0'); end if; -- purely numeric, e.g. 00001
    if new.virtual_account_no is null then new.virtual_account_no := lpad(s::text, 10, '0'); end if;
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_assign_agent_identity on agents;
create trigger trg_assign_agent_identity before insert on agents
  for each row execute function assign_agent_identity();

alter table requests add column if not exists booking_id      uuid references group_bookings(id) on delete set null;
alter table requests add column if not exists pnr_id          uuid references pnrs(id) on delete set null;
alter table requests add column if not exists fare_total      numeric(12,2);
alter table requests add column if not exists amount_received numeric(12,2) not null default 0;
alter table requests add column if not exists payment_status  text not null default 'unpaid';
alter table requests add column if not exists reserved_at     timestamptz;
alter table requests add column if not exists issued_at       timestamptz;

alter table pnrs add column if not exists request_id    uuid references requests(id) on delete set null;
alter table pnrs add column if not exists fare_total    numeric(12,2);
alter table pnrs add column if not exists segments      jsonb;
alter table pnrs add column if not exists ticket_number text;
alter table pnrs add column if not exists issued_at     timestamptz;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete set null,
  request_id uuid references requests(id) on delete set null,
  booking_id uuid references group_bookings(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'PKR',
  kind text not null default 'advance',
  status text not null default 'received',
  bank_ref text unique,
  virtual_account_no text,
  payer_name text,
  raw jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_agent   on payments (agent_id);
create index if not exists idx_payments_request on payments (request_id);
create index if not exists idx_payments_vacct   on payments (virtual_account_no);

create table if not exists ticket_documents (
  id uuid primary key default gen_random_uuid(),
  pnr_id uuid references pnrs(id) on delete cascade,
  request_id uuid references requests(id) on delete set null,
  agent_id uuid references agents(id) on delete set null,
  passenger_name text,
  ticket_number text unique,
  doc_path text,
  source text not null default 'amadeus',
  created_at timestamptz not null default now()
);
create index if not exists idx_ticketdocs_pnr     on ticket_documents (pnr_id);
create index if not exists idx_ticketdocs_agent   on ticket_documents (agent_id);
create index if not exists idx_ticketdocs_request on ticket_documents (request_id);

alter table payments         enable row level security;
alter table ticket_documents enable row level security;
drop policy if exists own_payments on payments;
create policy own_payments on payments for select using (agent_id in (select id from agents where auth_user_id = auth.uid()));
drop policy if exists admin_all_payments on payments;
create policy admin_all_payments on payments for all using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));
drop policy if exists own_ticketdocs on ticket_documents;
create policy own_ticketdocs on ticket_documents for select using (agent_id in (select id from agents where auth_user_id = auth.uid()));
drop policy if exists admin_all_ticketdocs on ticket_documents;
create policy admin_all_ticketdocs on ticket_documents for all using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));

-- ============================================================================
-- Company collection bank accounts (see migrations/0003_banks.sql)
-- ============================================================================
-- ============================================================================

create table if not exists banks (
  id           uuid primary key default gen_random_uuid(),
  sort_order   int  not null default 0,
  bank_name    text not null,
  title        text not null,            -- account title
  account_no   text not null,
  iban         text unique,
  swift        text,
  logo_url     text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table banks enable row level security;

-- Everyone signed in can read the collection accounts (agents need them to pay).
drop policy if exists read_banks on banks;
create policy read_banks on banks for select using (auth.role() = 'authenticated');

-- Only admins may manage them.
drop policy if exists admin_manage_banks on banks;
create policy admin_manage_banks on banks for all
  using (exists (select 1 from agents a where a.auth_user_id = auth.uid() and a.role = 'admin'))
  with check (exists (select 1 from agents a where a.auth_user_id = auth.uid() and a.role = 'admin'));

-- --- Seed the six collection banks (idempotent on IBAN) ----------------------
insert into banks (sort_order, bank_name, title, account_no, iban) values
  (1, 'Meezan Bank',        'CLASSIC AVIATION (SMC- PVT) LIMITED', '03010109339343',       'PK62MEZN0003010109339343'),
  (2, 'Bank Alfalah',       'CLASSIC AVIATION (SMC) PVT LTD',      '00351010049225',       'PK25ALFH0035001010049225'),
  (3, 'Habib Bank Limited', 'CLASSIC AVIATION PVT LTD',            '06027992518503',       'PK28HABB0006027992518503'),
  (4, 'United Bank Ltd',    'CLASSIC AVIATION (SMC- PVT) LTD',     '0593304771028',        'PK85UNIL0109000304771028'),
  (5, 'The Bank of Khyber', 'CLASSIC GROUP OF TRAVELS',            '50123007825788',       'PK18KHYB5012003007825788'),
  (6, 'Allied Bank',        'CLASSIC GROUP OF TRAVELS',            '56700020003869440015', 'PK95ABPA0020003869440015')
on conflict (iban) do update set
  bank_name  = excluded.bank_name,
  title      = excluded.title,
  account_no = excluded.account_no,
  sort_order = excluded.sort_order;


-- =====================================================================
-- 0005: Agent approval workflow + limited company admins (see migration).
-- =====================================================================
do $$ begin
  create type agent_status as enum ('pending','active','suspended','rejected');
exception when duplicate_object then null; end $$;

alter table agents add column if not exists status         agent_status not null default 'pending';
alter table agents add column if not exists is_super_admin boolean      not null default false;
alter table agents add column if not exists approved_at    timestamptz;
alter table agents add column if not exists approved_by    uuid references agents(id);

-- Auto-create a PENDING agent profile whenever someone registers.
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

-- =====================================================================
-- 0004: Group booking quotes, payment assessment, passenger holds, and
--       7-digit numeric agent ids. (Mirror of migration 0004.)
-- =====================================================================
alter table group_bookings add column if not exists capacity        int;
alter table group_bookings add column if not exists fare_adt        numeric(12,2);
alter table group_bookings add column if not exists fare_chd        numeric(12,2);
alter table group_bookings add column if not exists fare_inf        numeric(12,2);
alter table group_bookings add column if not exists amount_received numeric(12,2) not null default 0;
alter table group_bookings add column if not exists payment_status  text not null default 'unpaid';
alter table group_bookings add column if not exists pnr_id          uuid references pnrs(id) on delete set null;
alter table group_bookings add column if not exists pnr_code        text;
alter table group_bookings add column if not exists quoted_at       timestamptz;
alter table group_bookings add column if not exists admin_notes     text;

alter table passengers add column if not exists hold          boolean not null default false;
alter table passengers add column if not exists hold_until    date;
alter table passengers add column if not exists hold_reason   text;
alter table passengers add column if not exists ticket_number text;
alter table passengers add column if not exists issued        boolean not null default false;

alter type reminder_window  add value if not exists 'PAY-48h';
alter type reminder_window  add value if not exists 'PAY-24h';
alter type reminder_channel add value if not exists 'inapp';

-- 7-digit purely-numeric, random, unique agent ids (id == virtual account no).
create or replace function assign_agent_identity() returns trigger as $$
declare
  candidate text;
  tries int := 0;
begin
  if new.agent_code is null then
    loop
      candidate := lpad((floor(random() * 9000000) + 1000000)::bigint::text, 7, '0');
      exit when not exists (select 1 from agents where agent_code = candidate);
      tries := tries + 1;
      if tries > 50 then
        raise exception 'Could not allocate a unique 7-digit agent code';
      end if;
    end loop;
    new.agent_code := candidate;
  end if;
  if new.virtual_account_no is null then
    new.virtual_account_no := new.agent_code;
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_assign_agent_identity on agents;
create trigger trg_assign_agent_identity before insert on agents
  for each row execute function assign_agent_identity();

do $$
declare
  r record;
  candidate text;
  tries int;
begin
  for r in select id from agents where agent_code is null or char_length(agent_code) <> 7 loop
    tries := 0;
    loop
      candidate := lpad((floor(random() * 9000000) + 1000000)::bigint::text, 7, '0');
      exit when not exists (select 1 from agents where agent_code = candidate);
      tries := tries + 1;
      exit when tries > 50;
    end loop;
    update agents set agent_code = candidate, virtual_account_no = candidate where id = r.id;
  end loop;
end $$;
