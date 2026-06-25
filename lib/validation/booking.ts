import { z } from 'zod'
import { passengerSchema } from './passenger'

// Agent-submitted group booking. The agent provides the group capacity and the
// passenger manifest (names, DOB, passport no., passport expiry). The PNR and
// the per-passenger fares are added LATER by an admin — the agent never sets
// them. A malformed/empty submission fails safely as a 400.
export const bookingFormSchema = z.object({
  airline: z.string().min(1, 'Airline required'),
  origin: z.string().min(1, 'Origin required'),
  destination: z.string().min(1, 'Destination required'),
  travelDate: z.string().min(1, 'Travel date required'),
  capacity: z.coerce.number().int().min(1, 'Group capacity required'),
  currency: z.string().default('PKR'),
  data: z.array(passengerSchema).min(1, 'At least one passenger is required'),
})
export type BookingForm = z.infer<typeof bookingFormSchema>

// ADMIN quote: assign the PNR + per-passenger fares (ADT / Child / Infant) and
// an optional ticketing time limit. Payment due is assessed from these fares
// against the passenger manifest. amountReceived lets the admin record money in.
export const bookingQuoteSchema = z.object({
  pnrCode: z
    .string()
    .optional()
    .transform((s) => (s ? s.toUpperCase() : undefined)),
  fareAdt: z.coerce.number().min(0).default(0),
  fareChd: z.coerce.number().min(0).default(0),
  fareInf: z.coerce.number().min(0).default(0),
  amountReceived: z.coerce.number().min(0).optional(),
  expiryAt: z.string().optional(),
  adminNotes: z.string().optional(),
})
export type BookingQuote = z.infer<typeof bookingQuoteSchema>

// ADMIN hold: hold ticket issuance for a specific passenger until a date.
export const passengerHoldSchema = z.object({
  hold: z.boolean(),
  holdUntil: z.string().optional(),
  holdReason: z.string().optional(),
})
export type PassengerHold = z.infer<typeof passengerHoldSchema>
