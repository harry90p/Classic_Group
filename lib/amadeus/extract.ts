// =====================================================================
// High-level Amadeus extraction used by the lifecycle endpoints.
//   extractReservationInto(pnrId, pnrCode)  -> enrich the PNR row with segments
//   extractTicketsInto(pnrId, ...)          -> pull issued e-tickets, store PDFs,
//                                              create ticket_documents rows
// All steps are best-effort: if Amadeus isn't enabled they no-op so the admin
// can still attach the e-ticket manually.
// =====================================================================
import { supabaseAdmin } from '../supabase/admin'
import { amadeusEnabled, retrieveReservation, retrieveTicketDocuments } from './client'
import { uploadTicketPdf } from '../storage/tickets'

export async function extractReservationInto(pnrId: string, pnrCode: string): Promise<void> {
  if (!amadeusEnabled) return
  try {
    const res = await retrieveReservation(pnrCode)
    if (!res) return
    await supabaseAdmin
      .from('pnrs')
      .update({
        airline: res.airline ?? undefined,
        segments: res.segments ?? null,
        expiry_at: res.ticketingDeadline ?? undefined,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', pnrId)
  } catch (e) {
    console.error('[amadeus.extractReservation] failed:', (e as Error).message)
  }
}

export async function extractTicketsInto(opts: {
  pnrId: string
  pnrCode: string
  requestId: string | null
  agentId: string | null
}): Promise<{ count: number }> {
  if (!amadeusEnabled) return { count: 0 }
  let count = 0
  try {
    const tickets = await retrieveTicketDocuments(opts.pnrCode)
    for (const t of tickets) {
      const path = `${opts.agentId ?? 'unknown'}/${opts.pnrCode}/${t.ticketNumber}.pdf`
      const up = await uploadTicketPdf(path, t.pdf)
      if (!up.ok) continue
      await supabaseAdmin.from('ticket_documents').upsert(
        {
          pnr_id: opts.pnrId,
          request_id: opts.requestId,
          agent_id: opts.agentId,
          passenger_name: t.passengerName ?? null,
          ticket_number: t.ticketNumber,
          doc_path: path,
          source: 'amadeus',
        },
        { onConflict: 'ticket_number' },
      )
      // Record the primary ticket number on the PNR for quick reference.
      if (count === 0) {
        await supabaseAdmin.from('pnrs').update({ ticket_number: t.ticketNumber }).eq('id', opts.pnrId)
      }
      count++
    }
  } catch (e) {
    console.error('[amadeus.extractTickets] failed:', (e as Error).message)
  }
  return { count }
}
