import { z } from 'zod'

// Option A — manual PNR entry. expiryAt is required because it's the deadline
// the T-48h / T-24h reminders fire from.
export const manualPnrSchema = z.object({
  pnrCode: z.string().min(3, 'PNR code required'),
  airline: z.string().optional(),
  bookingId: z.string().uuid().optional(),
  // Admin-only: attach the PNR to a specific agent's account.
  agentId: z.string().uuid().optional(),
  status: z.enum(['pending', 'ticketed', 'expired', 'cancelled']).default('pending'),
  bookingAt: z.string().optional(),
  issuanceAt: z.string().optional(),
  expiryAt: z.string().min(1, 'Deadline (expiry) is required for reminders'),
})

export type ManualPnr = z.infer<typeof manualPnrSchema>
