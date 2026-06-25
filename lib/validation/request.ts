import { z } from 'zod'

// Validation for agent-created service / custom-package requests.
export const requestSchema = z.object({
  requestType: z
    .enum([
      'custom_package',
      'visa',
      'ticket',
      'hotel',
      'transport',
      'insurance',
      'ziyarat',
      'tour',
      'other',
    ])
    .default('custom_package'),
  title: z.string().min(2, 'Title required'),
  destination: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  paxCount: z.coerce.number().int().min(1).default(1),
  departureDate: z.string().optional(),
  returnDate: z.string().optional(),
  nights: z.coerce.number().int().min(0).optional(),
  hotel: z.string().optional(),
  transport: z.string().optional(),
  inclusions: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  currency: z.string().default('PKR'),
  notes: z.string().optional(),
})

export type RequestInput = z.infer<typeof requestSchema>

// Admin status-update payload (free status change + notes).
export const requestUpdateSchema = z.object({
  status: z.enum([
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'processing',
    'completed',
    'cancelled',
    'reserved',
    'issued',
  ]),
  adminNotes: z.string().optional(),
})

export type RequestUpdateInput = z.infer<typeof requestUpdateSchema>

// Admin RESERVES a request: attaches the Amadeus PNR + ticketing time limit.
// expiryAt is required — it is the TTL the T-48h / T-24h reminders fire from.
export const reserveSchema = z.object({
  pnrCode: z.string().min(3, 'PNR code required').transform((s) => s.toUpperCase()),
  airline: z.string().optional(),
  expiryAt: z.string().min(1, 'Ticketing time limit is required'),
  fareTotal: z.coerce.number().min(0).optional(),
  adminNotes: z.string().optional(),
})

export type ReserveInput = z.infer<typeof reserveSchema>

// Admin ISSUES a reserved request after full payment is confirmed.
// `override` lets an admin force-issue when payment is settled off-system.
export const issueSchema = z.object({
  override: z.boolean().optional().default(false),
  ticketNumber: z.string().optional(),
  adminNotes: z.string().optional(),
})

export type IssueInput = z.infer<typeof issueSchema>
