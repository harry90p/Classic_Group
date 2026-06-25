import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { supabaseAdmin } from '../../../../../lib/supabase/admin'
import { reserveSchema } from '../../../../../lib/validation/request'
import { isSupabaseConfigured } from '../../../../../lib/supabase/env'
import { extractReservationInto } from '../../../../../lib/amadeus/extract'
import { notifyAgent } from '../../../../../lib/notify'

// ADMIN: reserve a request.
// Admin has already created the booking in Amadeus by hand; here they record the
// PNR + ticketing time limit. We:
//   1. create/link a group_booking (status 'reserved') so Metabase sees it,
//   2. create/link a PNR row (status 'reserved') with the TTL -> reminders,
//   3. flip the request to 'reserved',
//   4. best-effort auto-extract the reservation from Amadeus to enrich it,
//   5. notify the agent (the reservation now shows on their portal).
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
  const parsed = reserveSchema.safeParse(body)
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

  // Load the request (service-role: lifecycle writes bypass RLS safely here).
  const { data: r } = await supabaseAdmin
    .from('requests')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!r) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  const { pnrCode, airline, expiryAt, fareTotal, adminNotes } = parsed.data
  const expiryISO = new Date(expiryAt).toISOString()

  // 1. Ensure a linked group_booking exists (auto-record for Metabase).
  let bookingId: string | null = r.booking_id
  if (!bookingId) {
    const { data: booking } = await supabaseAdmin
      .from('group_bookings')
      .insert({
        agent_id: r.agent_id,
        reference: `REQ-${String(id).slice(0, 8).toUpperCase()}`,
        airline: airline ?? null,
        destination: r.destination ?? null,
        travel_date: r.departure_date ?? null,
        pax_count: r.pax_count ?? 0,
        status: 'reserved',
        fare_total: fareTotal ?? r.budget ?? null,
        currency: r.currency ?? 'PKR',
      })
      .select('id')
      .single()
    bookingId = booking?.id ?? null
  } else {
    await supabaseAdmin
      .from('group_bookings')
      .update({ status: 'reserved', airline: airline ?? undefined, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
  }

  // 2. Create / link the PNR (dedup on source+code).
  const { data: pnr } = await supabaseAdmin
    .from('pnrs')
    .upsert(
      {
        booking_id: bookingId,
        request_id: id,
        agent_id: r.agent_id,
        pnr_code: pnrCode,
        airline: airline ?? null,
        status: 'reserved',
        source: 'manual',
        booking_at: new Date().toISOString(),
        expiry_at: expiryISO,
        fare_total: fareTotal ?? null,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'source,pnr_code' },
    )
    .select('id')
    .single()

  // 3. Flip the request to reserved.
  await supabaseAdmin
    .from('requests')
    .update({
      status: 'reserved',
      booking_id: bookingId,
      pnr_id: pnr?.id ?? null,
      fare_total: fareTotal ?? r.fare_total ?? r.budget ?? null,
      admin_notes: adminNotes ?? r.admin_notes ?? null,
      processed_by: admin.id,
      processed_at: new Date().toISOString(),
      reserved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // 4. Best-effort: auto-extract reservation details from Amadeus.
  if (pnr?.id) await extractReservationInto(pnr.id, pnrCode)

  // 5. Notify the agent — reservation is now visible on their portal.
  await notifyAgent({
    agentId: r.agent_id,
    title: `Reservation confirmed — PNR ${pnrCode}`,
    body:
      `Your group request "${r.title}" has been reserved (PNR ${pnrCode}` +
      `${airline ? `, ${airline}` : ''}). Ticketing time limit: ${new Date(expiryISO).toLocaleString()}. ` +
      `Please ensure full payment before the deadline to confirm issuance.`,
  })

  return NextResponse.json({ ok: true, pnrId: pnr?.id ?? null, bookingId }, { status: 200 })
}
