// =====================================================================
// Amadeus client — reservation retrieval + e-ticket document retrieval.
//
// The admin creates/issues the PNR INSIDE Amadeus (manual GDS work). This
// module only READS back from Amadeus so the site can:
//   - auto-extract the reservation (segments) to show the agent on "reserved";
//   - auto-extract the issued e-ticket document(s) to share on "issued".
//
// Guarded stub (mirrors lib/pnr/sources/amadeus.ts): only "live" when the
// AMADEUS_* env vars are set. Until then it returns nulls/[] so the lifecycle
// still works end-to-end (admin can attach the ticket PDF manually).
//
// Group PNRs created by hand are only visible through Amadeus for Enterprise
// (Web Services / SOAP): Security_Authenticate -> PNR_Retrieve ->
// (for documents) TicketDocument / Fare_* services or DOCS retrieval.
// =====================================================================
const endpoint = process.env.AMADEUS_ENDPOINT
const username = process.env.AMADEUS_USERNAME
const password = process.env.AMADEUS_PASSWORD
const officeId = process.env.AMADEUS_OFFICE_ID

export const amadeusEnabled = Boolean(endpoint && username && password && officeId)

export type AmadeusSegment = {
  airline?: string
  flightNumber?: string
  from?: string
  to?: string
  departure?: string // ISO
  arrival?: string // ISO
  cabin?: string
}

export type AmadeusReservation = {
  pnrCode: string
  airline?: string
  ticketingDeadline?: string // ISO — the TTL (OPW/OPC option element)
  segments: AmadeusSegment[]
  passengers: { name: string; type?: string }[]
}

export type AmadeusTicket = {
  ticketNumber: string
  passengerName?: string
  // Raw e-ticket document as bytes (PDF). Stored in the 'tickets' bucket.
  pdf: Buffer
}

// Retrieve a reservation by PNR code. Returns null when Amadeus is not enabled
// or the record can't be read (caller falls back to admin-entered data).
export async function retrieveReservation(pnrCode: string): Promise<AmadeusReservation | null> {
  if (!amadeusEnabled) return null
  // TODO(amadeus): Security_Authenticate -> PNR_Retrieve(pnrCode).
  // Map air segments, passengers and the ticketing time limit (OPW/OPC) here.
  console.warn(`[amadeus] retrieveReservation(${pnrCode}) — SOAP not yet implemented`)
  return null
}

// Retrieve issued e-ticket documents for a PNR (after the admin issues them in
// Amadeus). Returns [] when not enabled.
export async function retrieveTicketDocuments(pnrCode: string): Promise<AmadeusTicket[]> {
  if (!amadeusEnabled) return []
  // TODO(amadeus): PNR_Retrieve -> read FA/ticket elements -> fetch the e-ticket
  // document PDF per passenger and return as Buffer.
  console.warn(`[amadeus] retrieveTicketDocuments(${pnrCode}) — SOAP not yet implemented`)
  return []
}
