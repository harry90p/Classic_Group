# Deployment — Vercel or Netlify

This app is a standard **Next.js 16 (App Router) + React 19** project. It runs
natively as a serverless/SSR app on both **Vercel** and **Netlify** — no app
code changes are needed. Only platform config files were added:

- `vercel.json` — Vercel build config
- `netlify.toml` — Netlify build config + Next.js runtime plugin
- `.nvmrc` — pins Node 20 (required by Next 16 / React 19)

> The old Hostinger/cPanel guide is kept as `DEPLOYMENT-hostinger.md` for reference.

---

## Option A — Vercel (recommended for Next.js)

1. Push this repo to GitHub/GitLab/Bitbucket (or run `vercel` from the CLI).
2. In Vercel → **New Project** → import the repo. Framework is auto-detected as **Next.js**.
3. Build settings (auto-filled from `vercel.json`):
   - Build command: `next build`
   - Install command: `npm install`
   - Output: handled automatically by Vercel.
4. **Environment Variables** → add every key from `.env.example` (see list below).
   Set them for **Production** (and Preview if you want preview deploys to work).
5. Deploy. Vercel gives you a `*.vercel.app` URL; add your custom domain under
   **Settings → Domains**.

### Admin subdomain on Vercel
The app rewrites the admin host to `/admin` (see `lib/supabase/middleware.ts`).
Add both your apex/`www` domain **and** the admin host (e.g. `admin.yourdomain.com`)
under **Settings → Domains**, then point DNS at Vercel. No code change needed.

---

## Option B — Netlify

1. Push the repo to your Git provider.
2. In Netlify → **Add new site → Import an existing project**.
3. Build settings (auto-filled from `netlify.toml`):
   - Build command: `npm run build`
   - The **`@netlify/plugin-nextjs`** runtime is installed automatically (declared
     in `netlify.toml`) and handles SSR, API routes, middleware, and Server Actions.
   - `NODE_VERSION=20` is set in `netlify.toml`.
4. **Site settings → Environment variables** → add every key from `.env.example`.
5. Deploy, then add your custom domain(s) under **Domain management** (including the
   `admin.` subdomain for the admin console).

---

## Environment variables (both platforms)

Copy these from `.env.example` and fill in your real values in the platform dashboard
(do **not** commit `.env.local`):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only secret** — never expose to client |
| `COMPANY_EMAIL_DOMAIN` | e.g. `classicgroupoftravels.com` |
| `BOOTSTRAP_ADMIN_EMAILS` | Optional — comma-separated bootstrap admin emails |
| `PNR_SOURCES` | `manual`, `amadeus`, `portal` (comma-separated) |
| `PORTAL_API_BASE` / `PORTAL_API_KEY` | Consolidator REST API (optional) |
| `AMADEUS_*` | Amadeus Enterprise SOAP creds (optional) |
| `SYNC_SECRET` | Protects `POST /api/pnrs/sync` |
| `FINANCIAL_API_BASE` / `FINANCIAL_API_KEY` | Optional |
| `RESEND_API_KEY` / `REMINDER_FROM_EMAIL` | Email (Resend) |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_REMINDER_TEMPLATE` | WhatsApp Cloud API |
| `REMINDER_WINDOWS_HOURS` | e.g. `48,24` |
| `BANK_IBAN_PREFIX` / `BANK_API_BASE` / `BANK_API_KEY` / `BANK_WEBHOOK_SECRET` | Bank payment monitoring |

---

## Scheduled jobs (PNR watcher + reminders)

Serverless platforms don't run an always-on worker, so schedule the existing
sync endpoint instead. The app already exposes:

```
POST /api/pnrs/sync
Authorization: Bearer <SYNC_SECRET>
```

Pick one scheduler (no code change required):

- **External cron** (e.g. cron-job.org, EasyCron): every 30 min, `POST` to
  `https://yourdomain.com/api/pnrs/sync` with header `Authorization: Bearer <SYNC_SECRET>`.
- **GitHub Actions** scheduled workflow doing the same `curl` POST.
- **Supabase scheduled Edge Function / pg_cron** that calls the endpoint.

> Vercel Cron and Netlify Scheduled Functions issue **GET** requests by default,
> while this endpoint is **POST-only**, so an external scheduler that can send a
> POST with the Bearer header is the zero-code-change option. (The full reminder
> dispatch in `scripts/pnr-watcher.ts` can still be run from any always-on box
> via `npm run pnr:watch` if you prefer.)

---

## Supabase setup (one-time, unchanged)

1. Create the schema: run `supabase/schema.sql` in the Supabase SQL editor.
2. Seed: `supabase/seed-admin.sql` then `supabase/seed-demo.sql`.
3. Create a **private** `tickets` storage bucket.
4. Point the bank webhook at `POST /api/payments/webhook`.
5. Change the super-admin password after first login.
