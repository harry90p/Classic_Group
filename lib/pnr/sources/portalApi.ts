import type { NormalizedPnr, PnrSource } from '../types'

// Option C — Generic portal / consolidator REST API.
// Polls GET {PORTAL_API_BASE}/pnrs (Bearer auth) and maps each record into
// NormalizedPnr. Adjust the field mapping to match your portal's response shape;
// the fallbacks below cover the most common key names.

const BASE = process.env.PORTAL_API_BASE
const KEY = process.env.PORTAL_API_KEY
const enabled = Boolean(BASE && KEY)

async function fetchPnrs(): Promise<NormalizedPnr[]> {
  if (!enabled) return []

  const res = await fetch(`${BASE}/pnrs`, {
    headers: { Authorization: `Bearer ${KEY}` },
    cache: 'no-store', // portal data changes constantly
  })
  if (!res.ok) throw new Error(`Portal API ${res.status}`)

  const json: any = await res.json()
  const rows: any[] = Array.isArray(json) ? json : (json.data ?? json.pnrs ?? [])

  return rows.map((r) => ({
    pnrCode: r.pnr ?? r.pnrCode ?? r.record_locator ?? r.recordLocator,
    airline: r.airline ?? r.carrier ?? null,
    agentRef: r.agent_ref ?? r.agentRef ?? r.agent_id ?? null,
    bookingAt: r.booking_at ?? r.bookedAt ?? r.created_at ?? null,
    issuanceAt: r.issuance_at ?? r.issuedAt ?? null,
    expiryAt:
      r.expiry_at ?? r.expiryAt ?? r.ttl ?? r.ticketing_deadline ?? r.timeLimit ?? null,
    status: (r.status ?? 'pending') as NormalizedPnr['status'],
    raw: r,
  }))
}

export const portalApiSource: PnrSource = { name: 'portal', enabled, fetchPnrs }
