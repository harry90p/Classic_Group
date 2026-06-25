<<<<<<< HEAD
# Classic Travels Rebuild — Starter Scaffold

A modern rebuild of **Classic Group of Travels** (public site + agent portal) on:

- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind**
- **Supabase** (Postgres + Auth + Storage) as the single source of truth
- **Hostinger (cPanel) behind Cloudflare** for hosting/CDN (matches the Wappalyzer scan)
- **cPanel cron jobs** for the PNR watcher + reminder engine
- **Resend** (email) + **WhatsApp Business Cloud API** (messaging)
- **Metabase** connected directly to the Supabase Postgres DB

## What's included

| Path | Purpose | Plan step |
|---|---|---|
| `supabase/schema.sql` | Full Postgres schema + indexes + RLS | Step 2 |
| `lib/supabase/*` | Browser + server Supabase clients | Step 1/3 |
| `app/login` | Auth entry (rebuild of `/login`) | Step 3 |
| `app/(portal)` | Authenticated portal shell | Step 3 |
| `lib/validation/passenger.ts` | Zod schema that fixes the `Undefined array key "data"` 500 | Step 4 |
| `lib/integrations/*` | Portal/GDS, financial, email, WhatsApp clients (server-only) | Step 1/5/6 |
| `scripts/pnr-watcher.ts` | Cron job: sync PNRs + fire T-48h / T-24h reminders | Step 5/6 |
| `DEPLOYMENT.md` | Hostinger + Cloudflare + cron setup | Step 1/8 |

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your keys
# create the schema in Supabase (SQL editor or psql):
#   paste supabase/schema.sql
npm run dev
```

Run the PNR watcher locally:

```bash
npm run pnr:watch
```

> The booking/passenger UI here is a foundation. Wire the exact fields, routes and copy from your discovery files (SPEC.md, site-map.json, design-system.md, api-inventory.md).
=======
# Classic_Group
Classic Group of Travels.
>>>>>>> 2c809d8b700aea18ac4646895e91fadf39c103b7
