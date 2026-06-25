# Step 7 — Metabase & Reporting

Metabase reads Supabase Postgres directly (read-only). You can't host Metabase
on shared cPanel, so use **Metabase Cloud** (or a small separate VM).

## 1. Create a read-only DB role
Run `read-only-role.sql` in the Supabase SQL editor (set a strong password).

## 2. Get connection details
Supabase → Project Settings → Database → Connection info:

- Host, Port (`5432`, or `6543` for the pooled connection)
- Database `postgres`
- User `metabase_ro`, password from step 1

## 3. Add the database in Metabase
Admin → Databases → Add → **PostgreSQL**. Enable SSL. Save & sync.

## 4. Build dashboards
Paste the queries from `queries.sql` as Native questions and pin them:

- Upcoming PNR deadlines
- Reminders sent (window × channel)
- Bookings by status
- Agent activity
- Ledger balances

Bookings auto-record from `/api/bookings`, so dashboards stay live with no
manual export.
