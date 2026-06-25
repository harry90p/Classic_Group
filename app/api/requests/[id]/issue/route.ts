import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { supabaseAdmin } from '../../../../../lib/supabase/admin'
import { issueSchema } from '../../../../../lib/validation/request'
import { isSupabaseConfigured } from '../../../../../lib/supabase/env'
import { extractTicketsInto } from '../../../../../lib/amadeus/extract'
import { notifyAgent } from '../../../../../lib/notify'

// ADMIN: issue a reserved request (after full payment is confirmed).
// Guarded by payment_status === 'full' unless { override: true } is sent
// (for payments settled off-system). On success we:
//   1. mark the PNR issued (+ booking ticketed),
//   2. flip the request to 'issued',
//   3. best-effort auto-extract the e-ticket PDF(s) from Amadeus to storage,
//   4. notify the agent (download button appears on their portal).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine
  }
  const parsed = issueSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('agents')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!admin || admin.role !== 'admin')
    return NextResponse.json({ error: 'Admins only' }, { status: 403 })

  const { data: r } = await supabaseAdmin
    .from('requests')
    .select('*, pnrs:pnr_id(id, pnr_code)')
    .eq('id', id)
    .maybeSingle()
  if (!r) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (r.status !== 'reserved' && !parsed.data.override)
    return NextResponse.json({ error: 'Request must be reserved before issuing.' }, { status: 409 })

  // Payment guard — full payment must be received (or explicit override).
  if (r.payment_status !== 'full' && !parsed.data.override) {
    return NextResponse.json(
      {
        error: 'Full payment not yet received.',
        paymentStatus: r.payment_status,
        amountReceived: r.amount_received,
        fareTotal: r.fare_total,
        hint: 'Confirm payment via the bank feed, or re-send with override:true to force-issue.',
      },
      { status: 402 },
    )
  }

  const pnrId: string | null = r.pnr_id
  const pnrCode: string | null = r.pnrs?.pnr_code ?? null
  const nowISO = new Date().toISOString()

  // 1. Mark PNR issued + booking ticketed.
  if (pnrId) {
    await supabaseAdmin
      .from('pnrs')
      .update({
        status: 'issued',
        issuance_at: nowISO,
        issued_at: nowISO,
        ticket_number: parsed.data.ticketNumber ?? undefined,
        last_synced_at: nowISO,
      })
      .eq('id', pnrId)
  }
  if (r.booking_id) {
    await supabaseAdmin
      .from('group_bookings')
      .update({ status: 'ticketed', updated_at: nowISO })
      .eq('id', r.booking_id)
  }

  // 2. Flip request to issued.
  await supabaseAdmin
    .from('requests')
    .update({
      status: 'issued',
      admin_notes: parsed.data.adminNotes ?? r.admin_notes ?? null,
      processed_by: admin.id,
      processed_at: nowISO,
      issued_at: nowISO,
      updated_at: nowISO,
    })
    .eq('id', id)

  // 3. Best-effort: auto-extract e-ticket document(s) from Amadeus -> storage.
  let ticketCount = 0
  if (pnrId && pnrCode) {
    const res = await extractTicketsInto({
      pnrId,
      pnrCode,
      requestId: id,
      agentId: r.agent_id,
    })
    ticketCount = res.count
  }

  // 4. Notify the agent — e-ticket (if extracted) is downloadable on the portal.
  await notifyAgent({
    agentId: r.agent_id,
    title: `Ticket issued — ${pnrCode ?? r.title}`,
    body:
      `Your group booking "${r.title}"${pnrCode ? ` (PNR ${pnrCode})` : ''} has been issued. ` +
      (ticketCount > 0
        ? `${ticketCount} e-ticket(s) are ready to download from your portal.`
        : `The e-ticket will appear in your portal shortly.`),
  })

  return NextResponse.json({ ok: true, ticketCount }, { status: 200 })
}
