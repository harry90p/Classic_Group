-- ============================================================================
-- 0003_banks.sql  —  Company collection bank accounts
-- ----------------------------------------------------------------------------
-- These are the accounts agents deposit into. Today they are the company's
-- GENERAL collection accounts. Later, when the bank provides structured
-- virtual accounts, each agent's deposits will be identified by appending the
-- agent's identifier (agents.virtual_account_no) to the base account so every
-- credit maps to exactly one agent. See lib/integrations/bankApi.ts.
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
