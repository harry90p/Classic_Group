-- =====================================================================
-- Migration 0002 — Group Booking Lifecycle
-- Submitted -> Reserved (PNR + ticketing time limit, auto-shared to agent)
-- -> Issued (e-ticket auto-extracted from Amadeus + shared to agent).
-- Payments are auto-monitored via the bank API using per-agent virtual
-- accounts whose number embeds the agent's code.
--
-- Safe to run on a database that already has migration 0001 (schema.sql).
-- Every statement is idempotent / guarded.
-- =====================================================================

-- --- New lifecycle states ---------------------------------------------
-- request_status: add 'reserved' and 'issued'
alter type request_status add value if not exists 'reserved';
alter type request_status add value if not exists 'issued';
-- pnr_status: add 'reserved' and 'issued' (legacy 'ticketed' kept as alias)
alter type pnr_status add value if not exists 'reserved';
alter type pnr_status add value if not exists 'issued';

-- --- Agent identity: code + bank virtual account ----------------------
-- The virtual account number embeds the agent serial so an inbound bank
-- transfer can be mapped straight back to the agent (and their ledger).
create sequence if not exists agent_serial_seq start 1;

alter table agents add column if not exists agent_code        text unique;
alter table agents add column if not exists virtual_account_no text unique;
alter table agents add column if not exists virtual_iban       text;

create or replace function assign_agent_identity() returns trigger as $$
declare s bigint;
begin
  if new.agent_code is null or new.virtual_account_no is null then
    s := nextval('agent_serial_seq');
    if new.agent_code is null then
      new.agent_code := lpad(s::text, 5, '0');               -- purely numeric, e.g. 00001
    end if;
    if new.virtual_account_no is null then
      new.virtual_account_no := lpad(s::text, 10, '0');      -- e.g. 0000000001
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assign_agent_identity on agents;
create trigger trg_assign_agent_identity
  before insert on agents
  for each row execute function assign_agent_identity();

-- Backfill any existing agents that predate this migration.
update agents
   set agent_code = coalesce(agent_code, lpad(nextval('agent_serial_seq')::text, 5, '0'))
 where agent_code is null;
update agents
   set virtual_account_no = coalesce(virtual_account_no, lpad(nextval('agent_serial_seq')::text, 10, '0'))
 where virtual_account_no is null;

-- --- Request <-> booking/pnr links + money fields ---------------------
alter table requests add column if not exists booking_id     uuid references group_bookings(id) on delete set null;
alter table requests add column if not exists pnr_id         uuid references pnrs(id) on delete set null;
alter table requests add column if not exists fare_total     numeric(12,2);
alter table requests add column if not exists amount_received numeric(12,2) not null default 0;
alter table requests add column if not exists payment_status  text not null default 'unpaid'; -- unpaid | advance | full
alter table requests add column if not exists reserved_at    timestamptz;
alter table requests add column if not exists issued_at      timestamptz;

-- --- PNR enrichment for reservation + issued ticket -------------------
alter table pnrs add column if not exists request_id    uuid references requests(id) on delete set null;
alter table pnrs add column if not exists fare_total    numeric(12,2);
alter table pnrs add column if not exists segments      jsonb;   -- auto-extracted reservation itinerary
alter table pnrs add column if not exists ticket_number text;
alter table pnrs add column if not exists issued_at     timestamptz;

-- --- Payments (auto-fed by the bank API webhook / poller) -------------
create table if not exists payments (
  id                 uuid primary key default gen_random_uuid(),
  agent_id           uuid references agents(id) on delete set null,
  request_id         uuid references requests(id) on delete set null,
  booking_id         uuid references group_bookings(id) on delete set null,
  amount             numeric(12,2) not null,
  currency           text not null default 'PKR',
  kind               text not null default 'advance',   -- advance | partial | full | adjustment
  status             text not null default 'received',  -- pending | received | reconciled | failed
  bank_ref           text unique,                        -- bank transaction id (idempotency key)
  virtual_account_no text,                                -- the virtual account the money landed in
  payer_name         text,
  raw                jsonb,                               -- original bank payload
  received_at        timestamptz not null default now(),
  created_at         timestamptz not null default now()
);
create index if not exists idx_payments_agent   on payments (agent_id);
create index if not exists idx_payments_request on payments (request_id);
create index if not exists idx_payments_vacct   on payments (virtual_account_no);

-- --- Issued e-ticket documents (auto-extracted from Amadeus) ----------
create table if not exists ticket_documents (
  id             uuid primary key default gen_random_uuid(),
  pnr_id         uuid references pnrs(id) on delete cascade,
  request_id     uuid references requests(id) on delete set null,
  agent_id       uuid references agents(id) on delete set null,
  passenger_name text,
  ticket_number  text unique,
  doc_path       text,                       -- object path in the private 'tickets' storage bucket
  source         text not null default 'amadeus', -- amadeus | manual
  created_at     timestamptz not null default now()
);
create index if not exists idx_ticketdocs_pnr     on ticket_documents (pnr_id);
create index if not exists idx_ticketdocs_agent   on ticket_documents (agent_id);
create index if not exists idx_ticketdocs_request on ticket_documents (request_id);

-- --- RLS: agents see only their own money + tickets; admins see all ---
alter table payments         enable row level security;
alter table ticket_documents enable row level security;

drop policy if exists own_payments on payments;
create policy own_payments on payments
  for select using (agent_id in (select id from agents where auth_user_id = auth.uid()));
drop policy if exists admin_all_payments on payments;
create policy admin_all_payments on payments
  for all using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));

drop policy if exists own_ticketdocs on ticket_documents;
create policy own_ticketdocs on ticket_documents
  for select using (agent_id in (select id from agents where auth_user_id = auth.uid()));
drop policy if exists admin_all_ticketdocs on ticket_documents;
create policy admin_all_ticketdocs on ticket_documents
  for all using (exists (select 1 from agents where auth_user_id = auth.uid() and role = 'admin'));

-- NOTE: create a PRIVATE storage bucket named 'tickets' in the Supabase
-- dashboard (Storage -> New bucket -> name: tickets, Public: OFF). The app
-- serves e-tickets through short-lived signed URLs only to the owning agent.
