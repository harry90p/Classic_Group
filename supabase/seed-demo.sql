-- =====================================================================
-- DEMO SEED — sample agents, package requests, near-expiry PNRs, news.
-- Run AFTER schema.sql (and ideally seed-admin.sql) in the Supabase SQL editor.
-- Safe to run once; it skips itself if the demo data already exists.
--
-- Test logins it creates:
--   agent1@classicgroupoftravels.com  /  Agent@2026   (role: agent)
--   agent2@classicgroupoftravels.com  /  Agent@2026   (role: sub_agent)
--
-- Log in as agent1 to see the PNR payment-deadline reminder pop-up.
-- Log in as the super-admin to see the request queue at admin.<domain>.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---- helper: create an auth login if it does not exist ---------------
create or replace function _seed_make_user(p_email text, p_pass text, p_name text)
returns uuid language plpgsql as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = p_email;
  if uid is not null then return uid; end if;
  uid := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    p_email, crypt(p_pass, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name),
    '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', p_email),
    'email', now(), now(), now()
  );
  return uid;
end $$;

do $$
declare
  a1_uid uuid; a2_uid uuid;
  a1 uuid; a2 uuid;
  bk uuid;
begin
  -- Bail out if the demo is already loaded.
  if exists (select 1 from requests where title = 'Umrah — Family of 5 (Demo)') then
    raise notice 'Demo data already present — skipping.';
    return;
  end if;

  -- 1) Test agents (logins + profiles) ---------------------------------
  a1_uid := _seed_make_user('agent1@classicgroupoftravels.com', 'Agent@2026', 'Bilal Ahmed');
  a2_uid := _seed_make_user('agent2@classicgroupoftravels.com', 'Agent@2026', 'Sana Tariq');

  -- The on_auth_user_created trigger may have already created pending rows,
  -- so upsert role + mark them approved/active for the demo.
  insert into agents (auth_user_id, full_name, email, whatsapp_number, role, status)
  values (a1_uid, 'Bilal Ahmed', 'agent1@classicgroupoftravels.com', '+923001234567', 'agent', 'active')
  on conflict (auth_user_id) do update
    set role = excluded.role, status = 'active', whatsapp_number = excluded.whatsapp_number, full_name = excluded.full_name;
  insert into agents (auth_user_id, full_name, email, whatsapp_number, role, status)
  values (a2_uid, 'Sana Tariq', 'agent2@classicgroupoftravels.com', '+923009876543', 'sub_agent', 'active')
  on conflict (auth_user_id) do update
    set role = excluded.role, status = 'active', whatsapp_number = excluded.whatsapp_number, full_name = excluded.full_name;

  select id into a1 from agents where auth_user_id = a1_uid;
  select id into a2 from agents where auth_user_id = a2_uid;

  -- 2) Sample package / service requests (varied types + statuses) -----
  insert into requests (agent_id, request_type, title, destination, client_name, client_phone, pax_count, departure_date, return_date, nights, hotel, transport, inclusions, budget, currency, notes, status, admin_notes)
  values
    (a1, 'custom_package', 'Umrah — Family of 5 (Demo)', 'Makkah & Madinah', 'Imran Sheikh', '+923011112222', 5, current_date + 20, current_date + 34, 14, '5★ near Haram', 'Private van', 'Visa, hotels, transport, ziyarat', 950000, 'PKR', 'Wheelchair needed for one elderly pax.', 'submitted', null),
    (a1, 'visa',           'KSA Umrah visas × 5',          'Saudi Arabia',     'Imran Sheikh', '+923011112222', 5, null, null, null, null, null, 'Umrah e-visa processing', 75000, 'PKR', null, 'under_review', 'Collecting passports.'),
    (a2, 'ticket',         'Group air tickets DXB',        'Dubai',            'Ayesha Khan',  '+923023334444', 12, current_date + 10, current_date + 17, null, null, null, 'Return economy, checked baggage', 1680000, 'PKR', 'Prefer Emirates if fare allows.', 'processing', 'Holding 12 seats; awaiting deposit.'),
    (a2, 'hotel',          'Hotel booking — Baku',         'Baku',             'Hamza Ali',    '+923035556666', 4, current_date + 30, current_date + 35, 5, '4★ city centre', null, 'Breakfast included', 320000, 'PKR', null, 'approved', 'Confirmed at Hotel X, ref BK-2291.'),
    (a1, 'tour',           'Maldives honeymoon package',   'Maldives',         'Zara Yousuf',  '+923047778888', 2, current_date + 45, current_date + 50, 5, 'Water villa', 'Speedboat transfer', 'Flights, resort, transfers, breakfast', 1450000, 'PKR', 'Anniversary cake on arrival.', 'completed', 'Delivered; invoice settled.'),
    (a2, 'transport',      'Ziyarat transport — Madinah',  'Madinah',          'Tariq Mehmood','+923059990000', 8, current_date + 22, null, null, null, 'Coaster (8 seats)', 'Driver + fuel', 120000, 'PKR', null, 'rejected', 'Dates unavailable; agent to re-quote.');

  -- 3) A couple of group bookings + near-expiry PNRs for agent1 --------
  --    (these trigger the dashboard reminder pop-up on login)
  insert into group_bookings (agent_id, reference, airline, origin, destination, travel_date, pax_count, status, fare_total, currency)
  values (a1, 'GB-DEMO-001', 'Saudia', 'KHI', 'JED', current_date + 20, 5, 'reserved', 950000, 'PKR')
  returning id into bk;

  insert into pnrs (booking_id, agent_id, pnr_code, airline, status, source, booking_at, issuance_at, expiry_at)
  values
    (bk,   a1, 'SV1A2B', 'Saudia',  'pending', 'manual', now() - interval '1 day', null, now() + interval '20 hours'),  -- within 24h
    (null, a1, 'EK9Z8Y', 'Emirates','pending', 'manual', now() - interval '2 days', null, now() + interval '40 hours'), -- within 48h
    (null, a2, 'QR5K5K', 'Qatar',   'pending', 'manual', now() - interval '1 day', null, now() + interval '5 days');   -- agent2, within payment-alert window

  -- 4) Announcements (admin-managed news / pop-ups) --------------------
  insert into announcements (title, body, level, audience, starts_at, ends_at, created_by)
  values
    ('Eid holidays', 'Our offices will be closed for Eid from the 1st to the 3rd. PNR reminders keep running automatically.', 'info', 'all', now(), now() + interval '30 days', a1),
    ('Settle outstanding deposits', 'Please clear pending group-booking deposits before the ticketing deadlines to avoid auto-cancellation.', 'payment', 'all', now(), now() + interval '14 days', a1);

  raise notice 'Demo data loaded.';
end $$;

-- tidy up the helper
drop function if exists _seed_make_user(text, text, text);
