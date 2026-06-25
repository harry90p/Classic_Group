-- Step 7: starter Metabase questions. Paste each into a Native (SQL) query,
-- then pin them to a dashboard.

-- 1) Upcoming PNR deadlines (next 7 days)
select pnr_code, airline, source, status, expiry_at
from pnrs
where status = 'pending'
  and expiry_at between now() and now() + interval '7 days'
order by expiry_at;

-- 2) Reminders sent (last 30 days) by window & channel
select reminder_window, channel, state, count(*) as cnt
from reminders
where created_at > now() - interval '30 days'
group by reminder_window, channel, state
order by reminder_window, channel;

-- 3) Bookings by status
select status, count(*) as bookings, coalesce(sum(fare_total), 0) as total_fare
from group_bookings
group by status
order by bookings desc;

-- 4) Agent activity (bookings + pax)
select a.full_name,
       count(b.id) as bookings,
       coalesce(sum(b.pax_count), 0) as pax
from agents a
left join group_bookings b on b.agent_id = a.id
group by a.full_name
order by bookings desc;

-- 5) Net ledger balance per agent
select a.full_name, coalesce(sum(l.amount), 0) as net
from agents a
left join ledger l on l.agent_id = a.id
group by a.full_name
order by net desc;
