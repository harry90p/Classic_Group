// Step 5: Portal / GDS API client (server-only).
// Keep this thin and typed. The watcher calls listPnrs() on a schedule.
// NOTE: per the Amadeus discussion, manual group PNRs may not be visible via
// self-service APIs. Until Enterprise/queue access exists, listPnrs() can read
// from agent-entered deadlines instead (see scripts/pnr-watcher.ts).

export type PortalPnr = {
  pnrCode: string
  airline?: string
  status: 'pending' | 'ticketed' | 'expired' | 'cancelled'
  bookingAt?: string
  issuanceAt?: string
  expiryAt?: string // ticketing time limit
}

const BASE = process.env.PORTAL_API_BASE
const KEY = process.env.PORTAL_API_KEY

export async function listPnrs(): Promise<PortalPnr[]> {
  if (!BASE || !KEY) return [] // not configured yet — watcher falls back to DB
  const res = await fetch(`${BASE}/pnrs`, {
    headers: { Authorization: `Bearer ${KEY}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Portal API ${res.status}`)
  return (await res.json()) as PortalPnr[]
}
