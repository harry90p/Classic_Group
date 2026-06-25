# Deployment — Hostinger (cPanel) + Cloudflare

## 1. Hostinger: Node.js app
1. In cPanel → Setup Node.js App → create app (Node 20+ — required by Next.js 16), app root `~/app`.
2. Upload the repo (Git or file manager) into the app root.
3. Set the Application startup file or use `npm run build` + `npm run start`.
4. Add all env vars from `.env.example` in the Node app's environment panel.
5. `npm install` then `npm run build` from the cPanel terminal / app UI.

## 2. Cloudflare (CDN / SSL / WAF)
1. Point your domain's nameservers to Cloudflare.
2. Proxy (orange cloud) the `@` and `www` records to the Hostinger IP.
3. SSL/TLS mode: Full (strict). Enable Auto Minify + Brotli for static assets.
4. Add a WAF rule to rate-limit `/login` and the portal API routes.

## 3. cPanel cron — PNR watcher + reminders
In cPanel → Cron Jobs, run every 30 minutes:

```
*/30 * * * * cd ~/app && ./node_modules/.bin/tsx scripts/pnr-watcher.ts >> ~/app/logs/pnr.log 2>&1
```

> Shared hosting kills long-running processes, so we poll on a schedule instead of running an always-on worker.

## 4. Metabase (BI)
- Metabase can't run on shared cPanel. Use Metabase Cloud (or a small VPS).
- Connect it to the Supabase Postgres DB with a read-only role.
- Group bookings written by the app appear automatically — no separate ETL.
