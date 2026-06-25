# Admin Panel access (admin.<yourdomain>)

The Admin Panel is served from a **subdomain** instead of `yourdomain.com/admin`.

- Agents:  `https://yourdomain.com`  → agent portal
- Admins:  `https://admin.yourdomain.com`  → Admin Panel

The app handles the routing automatically (`lib/supabase/middleware.ts`):

- On `admin.yourdomain.com`, the bare root (`/`) serves the Admin Panel dashboard.
- On the main domain, any visit to `/admin` is **redirected** to `admin.yourdomain.com` (production only; `localhost` keeps `/admin` for local dev).
- After login, **admins are sent to the admin subdomain automatically**; everyone else goes to the agent dashboard.

## 1) DNS + hosting (Hostinger + Cloudflare)

1. **Cloudflare DNS** → add a record for the subdomain:
   - Type `A` (or `CNAME`), Name `admin`, value = same target as your root domain, Proxy = On (orange cloud).
2. **Hostinger**: add `admin.yourdomain.com` as an additional domain/alias that points to the **same Next.js app** (same deployment/document root). Do **not** create a separate site — it must serve the same app so the middleware can route it.
3. Make sure your SSL/TLS certificate covers the wildcard or the `admin.` subdomain (Cloudflare Universal SSL covers one level of subdomain by default).

> If you deploy on a platform like Vercel instead, just add `admin.yourdomain.com` as an additional domain on the same project.

## 2) Super-admin login

Run `supabase/seed-admin.sql` once in the Supabase SQL editor (after `schema.sql`). It creates:

```
Email:    admin@classicgroupoftravels.com
Password: ClassicAdmin@2026
```

Log in at `https://admin.yourdomain.com` (or the main login page — you'll be redirected to the admin subdomain automatically).

**Change this password right after the first login.**

### Promote an existing account instead
```sql
update agents set role = 'admin' where email = 'you@example.com';
```

### Create more admins
Either register the agent normally, then run the `update agents set role='admin'` line for their email, or add them in Supabase > Authentication > Users and set their `agents.role` to `admin`.
