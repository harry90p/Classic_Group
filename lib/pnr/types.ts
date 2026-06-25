// Step 5: pluggable PNR-source layer.
// Every source (manual entry, Amadeus Enterprise, generic portal API) maps its
// data into this single normalized shape, then sync.ts upserts it into `pnrs`.

export type NormalizedPnr = {
  pnrCode: string
  airline?: string | null
  agentRef?: string | null // external agent id -> mapped to agents.external_ref
  bookingAt?: string | null // ISO
  issuanceAt?: string | null // ISO
  expiryAt?: string | null // ISO — ticketing time limit / payment deadline (drives reminders)
  status?: 'pending' | 'ticketed' | 'expired' | 'cancelled'
  raw?: unknown
}

export interface PnrSource {
  /** Stable id used in the PNR_SOURCES env list. */
  name: 'manual' | 'amadeus' | 'portal'
  /** True only when this source's credentials/config are present. */
  enabled: boolean
  /** Returns the current PNRs from this source. Manual returns [] (rows already in DB). */
  fetchPnrs(): Promise<NormalizedPnr[]>
}
