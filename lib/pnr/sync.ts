import { supabaseAdmin } from '../supabase/admin'
import { manualSource } from './sources/manual'
import { amadeusSource } from './sources/amadeus'
import { portalApiSource } from './sources/portalApi'
import type { PnrSource } from './types'

const ALL: PnrSource[] = [manualSource, amadeusSource, portalApiSource]

// PNR_SOURCES env decides which sources run, e.g. "manual,portal".
// Defaults to manual only. A source must also be `enabled` (creds present).
export function activeSources(): PnrSource[] {
  const want = (process.env.PNR_SOURCES ?? 'manual')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return ALL.filter((s) => want.includes(s.name) && s.enabled)
}

// Pulls from every active source and upserts into `pnrs` (dedup on source+code).
// Returns a per-source count (or -1 if that source errored).
export async function syncPnrs(): Promise<Record<string, number>> {
  const summary: Record<string, number> = {}

  for (const source of activeSources()) {
    let pnrs
    try {
      pnrs = await source.fetchPnrs()
    } catch (e) {
      console.error(`PNR source "${source.name}" failed:`, (e as Error).message)
      summary[source.name] = -1
      continue
    }
    summary[source.name] = pnrs.length

    for (const p of pnrs) {
      if (!p.pnrCode) continue

      // Map an external agent ref to our internal agent id when possible.
      let agentId: string | null = null
      if (p.agentRef) {
        const { data } = await supabaseAdmin
          .from('agents')
          .select('id')
          .eq('external_ref', p.agentRef)
          .maybeSingle()
        agentId = data?.id ?? null
      }

      await supabaseAdmin.from('pnrs').upsert(
        {
          agent_id: agentId,
          pnr_code: p.pnrCode,
          airline: p.airline ?? null,
          status: p.status ?? 'pending',
          source: source.name,
          booking_at: p.bookingAt ?? null,
          issuance_at: p.issuanceAt ?? null,
          expiry_at: p.expiryAt ?? null,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'source,pnr_code' },
      )
    }
  }

  return summary
}
