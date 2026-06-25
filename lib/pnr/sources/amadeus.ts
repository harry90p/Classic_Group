import type { NormalizedPnr, PnrSource } from '../types'

// Option B — Amadeus for Enterprise (Web Services / SOAP).
// Requires a commercial Amadeus contract; the free Self-Service tier cannot see
// manually-created group PNRs. Enable by setting AMADEUS_* env vars.
//
// Intended flow once credentials exist:
//   Security_Authenticate -> Queue_List (office queues)
//   -> PNR_Retrieve per record -> read ticketing time limit (OPW/OPC option
//      elements) and map it to expiryAt.
//
// Left as a guarded stub so the app builds & runs without Amadeus access. When
// you provide creds + a sample response, fill in the SOAP calls and the mapping
// to NormalizedPnr below.

const endpoint = process.env.AMADEUS_ENDPOINT
const username = process.env.AMADEUS_USERNAME
const password = process.env.AMADEUS_PASSWORD
const officeId = process.env.AMADEUS_OFFICE_ID

const enabled = Boolean(endpoint && username && password && officeId)

async function fetchPnrs(): Promise<NormalizedPnr[]> {
  if (!enabled) return []

  // TODO(amadeus): implement SOAP auth + Queue_List + PNR_Retrieve here.
  // Map each retrieved PNR into NormalizedPnr:
  //   { pnrCode, airline, bookingAt, issuanceAt, expiryAt (TTL), status }
  // Throwing here will be caught by sync.ts and logged without crashing.
  console.warn('[amadeus] enabled but SOAP integration not yet implemented')
  return []
}

export const amadeusSource: PnrSource = { name: 'amadeus', enabled, fetchPnrs }
