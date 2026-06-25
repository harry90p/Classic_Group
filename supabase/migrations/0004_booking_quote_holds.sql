-- =====================================================================
-- 0004 — Group booking quotes, payment assessment, passenger holds,
--        and 7-digit numeric agent ids.
-- Idempotent: safe to run more than once.
-- =====================================================================

-- 1) Group booking: admin-quoted fares + payment assessment + PNR link --
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

-- 2) Passenger-level ticket holds + issuance tracking -------------------
alter table passengers add column if not exists hold          boolean not null default false;
alter table passengers add column if not exists hold_until    date;
alter table passengers add column if not exists hold_reason   text;
alter table passengers add column if not exists ticket_number text;
alter table passengers add column if not exists issued        boolean not null default false;

-- 3) Payment reminder windows + in-app reminder channel ----------------
alter type reminder_window  add value if not exists 'PAY-48h';
alter type reminder_window  add value if not exists 'PAY-24h';
alter type reminder_channel add value if not exists 'inapp';

-- 4) 7-digit purely-numeric, random, unique agent ids ------------------
-- The agent id and virtual account number are the same 7-digit number.
create or replace function assign_agent_identity() returns trigger as $$
declare
  candidate text;
  tries int := 0;
begin
  if new.agent_code is null then
    loop
      -- 1000000 .. 9999999 (always exactly 7 digits)
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

-- Re-issue a fresh 7-digit id to any agent that doesn't already have one.
-- (Idempotent: leaves existing 7-digit codes untouched on re-run.)
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
