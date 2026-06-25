import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { supabaseAdmin } from '../../../../../lib/supabase/admin'
import { bookingQuoteSchema } from '../../../../../lib/validation/booking'
import { isSupabaseConfigured } from '../../../../../lib/supabase/env'
import { notifyAgent } from '../../../../../lib/notify'

// ADMIN: quote a group booking.
// The admin enters the per-passenger fares (ADT / Child / Infant) and — once
// the booking is reserved — the PNR + ticketing time limit. The total payable
// is assessed from those fares against the passenger manifest, and the
// remaining balance + payment status are recomputed. The agent is notified.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bookingQuoteSchema.safeParse(body)
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

  // Load the booking + its passenger manifest (service role bypasses RLS).
  const { data: booking } = await supabaseAdmin
    .from('group_bookings')
    .select('id, agent_id, airline, amount_received, pnr_id, currency')
    .eq('id', id)
    .maybeSingle()
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const { data: pax } = await supabaseAdmin
    .from('passengers')
    .select('pax_type')
    .eq('booking_id', id)

  const counts = { ADT: 0, CHD: 0, INF: 0 }
  for (const p of pax ?? []) {
    const t = (p.pax_type as string) === 'CHD' ? 'CHD' : (p.pax_type as string) === 'INF' ? 'INF' : 'ADT'
    counts[t] += 1
  }

  const { pnrCode, fareAdt, fareChd, fareInf, amountReceived, expiryAt, adminNotes } = parsed.data
  const fareTotal =
    counts.ADT * fareAdt + counts.CHD * fareChd + counts.INF * fareInf
  const received = amountReceived ?? Number(booking.amount_received ?? 0)
  const remaining = Math.max(0, fareTotal - received)
  const paymentStatus =
    fareTotal > 0 && received >= fareTotal ? 'full' : received > 0 ? 'partial' : 'unpaid'

  // If a PNR is supplied, record/refresh it so the ticketing-deadline reminders
  // can fire (mirrors the request reserve flow).
  let pnrId: string | null = booking.pnr_id ?? null
  const expiryISO = expiryAt ? new Date(expiryAt).toISOString() : null
  if (pnrCode) {
    const { data: pnr } = await supabaseAdmin
      .from('pnrs')
      .upsert(
        {
          booking_id: id,
          agent_id: booking.agent_id,
          pnr_code: pnrCode,
          airline: booking.airline ?? null,
          status: 'reserved',
          source: 'manual',
          booking_at: new Date().toISOString(),
          expiry_at: expiryISO,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'source,pnr_code' },
      )
      .select('id')
      .single()
    pnrId = pnr?.id ?? pnrId
  }

  const { error: upErr } = await supabaseAdmin
    .from('group_bookings')
    .update({
      fare_adt: fareAdt,
      fare_chd: fareChd,
      fare_inf: fareInf,
      fare_total: fareTotal,
      amount_received: received,
      payment_status: paymentStatus,
      pnr_code: pnrCode ?? undefined,
      pnr_id: pnrId,
      quoted_at: new Date().toISOString(),
      admin_notes: adminNotes ?? undefined,
      status: pnrCode ? 'reserved' : 'quoted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  // Notify the agent of the quote / reservation + outstanding balance.
  const cur = booking.currency ?? 'PKR'
  try {
    await notifyAgent({
      agentId: booking.agent_id,
      title: pnrCode
        ? `Group reserved — PNR ${pnrCode}`
        : 'Your group booking has been quoted',
      body:
        `Fare quoted: ${cur} ${fareTotal.toLocaleString()} ` +
        `(ADT ${counts.ADT}×${fareAdt}, CHD ${counts.CHD}×${fareChd}, INF ${counts.INF}×${fareInf}). ` +
        `Received ${cur} ${received.toLocaleString()}, remaining ${cur} ${remaining.toLocaleString()}.` +
        (pnrCode ? ` PNR ${pnrCode}.` : '') +
        (expiryISO ? ` Ticketing deadline: ${new Date(expiryISO).toLocaleString()}.` : ''),
    })
  } catch {
    // best-effort
  }

  return NextResponse.json(
    { ok: true, fareTotal, amountReceived: received, remaining, paymentStatus, pnrId },
    { status: 200 },
  )
}
