# Group Booking Lifecycle

End-to-end flow: agent request → admin reserves (PNR + time limit) → payment
monitored via bank API → admin issues → e-ticket auto-shared to the agent.

```
Agent portal              Admin panel                         Agent portal
────────────              ───────────                         ───────────
 submit group  ───▶  request: SUBMITTED
 request               check advance (bank feed)
                       reserve in Amadeus (manual) ─────────────────────
                       enter PNR + TTL ─▶ RESERVED  ──auto-share──▶ sees PNR + deadline
                       (bank API confirms full payment)
                       click Issued ─▶ ISSUED      ──auto-extract─▶ downloads e-ticket
```

## Statuses
- **requests**: `submitted → reserved → issued` (+ `under_review/approved/processing/rejected/cancelled`)
- **pnrs**: `reserved → issued` (drives the T-48h/T-24h reminders off `expiry_at`)

## What runs automatically
- **Reserve** (`POST /api/requests/[id]/reserve`): creates/links a `group_booking` + `pnr` (with the ticketing time limit), flips the request to `reserved`, best-effort pulls reservation details from Amadeus, and notifies the agent.
- **Payments** (`POST /api/payments/webhook` or cron poll): each agent has a **virtual account** (`agents.virtual_account_no`, IBAN = `BANK_IBAN_PREFIX` + that number). Incoming credits map straight to the agent → recorded in `payments` + `ledger` → request `payment_status` becomes `unpaid/advance/full`.
- **Issue** (`POST /api/requests/[id]/issue`): blocked until `payment_status = full` (or `override:true`), marks the PNR/booking issued, best-effort extracts the e-ticket PDF from Amadeus into the private `tickets` bucket, and notifies the agent.
- **Agent download**: `GET /api/tickets/[id]` returns a 2-minute signed URL, owner-scoped.

## Setup checklist
1. Run `supabase/schema.sql` (fresh) **or** `supabase/migrations/0002_booking_lifecycle.sql` (existing DB).
2. Create a **private** Storage bucket named `tickets` (Storage → New bucket → Public: OFF).
3. Set env (see `.env.example`): `BANK_IBAN_PREFIX`, `BANK_API_BASE/KEY` or `BANK_WEBHOOK_SECRET`, and `AMADEUS_*` when ready.
4. Point the bank's webhook at `/api/payments/webhook` (HMAC-SHA256 of the body in `x-bank-signature`).

## Collection banks & per-agent identification
- The 6 company collection accounts are seeded in the `banks` table (see `migrations/0003_banks.sql`) and shown to agents at **Portal → Bank Accounts**.
- Today these are **general** company accounts. The plan: when an agent registers, they already get a unique **purely-numeric Agent ID** (`agents.agent_code`, e.g. `00001`) and an identifying **account suffix** (`agents.virtual_account_no`).
- Once the bank provides structured **virtual accounts**, each agent's deposit account = the bank's base account **+ that agent's suffix**, so every incoming credit maps to exactly one agent automatically. `lib/integrations/bankApi.ts` → `ibanForAgent()` already composes this (`BANK_IBAN_PREFIX` + suffix); only the real prefix/format needs filling in at integration time.

## Still pluggable (provided later by you)
- **Bank API** — you'll share the API docs / webhook spec when ready. Adapter stub: `lib/integrations/bankApi.ts` (webhook verify + poll). Nothing else needs to change to switch it on.
- **Amadeus Enterprise (SOAP)** — you'll share the `PNR_Retrieve` + e-ticket document responses once you have Enterprise access. Adapter stub: `lib/amadeus/client.ts`.
- Until those are live, the **whole flow already works**: the admin enters the PNR + ticketing time limit by hand, payments can be posted to `/api/payments/webhook` (or recorded manually), and the e-ticket can be uploaded manually on the issued request — agents still see reservations and download tickets automatically.
