import type { PnrSource } from '../types'

// Option A — Manual capture.
// Agents enter PNRs + deadlines through the portal form (/pnrs/new), which
// writes straight to the `pnrs` table. Nothing to fetch on a schedule.
export const manualSource: PnrSource = {
  name: 'manual',
  enabled: true,
  async fetchPnrs() {
    return []
  },
}
