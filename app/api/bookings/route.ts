import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { bookingFormSchema } from '../../../lib/validation/booking'
import { isSupabaseConfigured } from '../../../lib/supabase/env'

// AGENT: submit a new group booking request.
// The agent supplies the group capacity + passenger manifest. The booking is
// created in 'draft' — an admin later quotes the fares and assigns the PNR.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bookingFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const form = parsed.data

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase not configured. Add keys to .env.local to save bookings.' },
      { status: 503 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!agent) return NextResponse.json({ error: 'No agent profile' }, { status: 403 })

  // Create the group booking in 'draft' (awaiting admin quote + PNR).
  const { data: booking, error: bErr } = await supabase
    .from('group_bookings')
    .insert({
      agent_id: agent.id,
      airline: form.airline,
      origin: form.origin,
      destination: form.destination,
      travel_date: form.travelDate,
      pax_count: form.data.length,
      capacity: form.capacity,
      currency: form.currency,
      status: 'draft',
    })
    .select('id')
    .single()
  if (bErr || !booking) {
    return NextResponse.json({ error: bErr?.message ?? 'Booking failed' }, { status: 500 })
  }

  const rows = form.data.map((p) => ({
    booking_id: booking.id,
    title: p.title,
    first_name: p.firstName,
    last_name: p.lastName,
    pax_type: p.paxType,
    dob: p.dob ?? null,
    passport_no: p.passportNo ?? null,
    passport_expiry: p.passportExpiry ?? null,
    nationality: p.nationality ?? null,
  }))
  const { error: pErr } = await supabase.from('passengers').insert(rows)
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  return NextResponse.json({ bookingId: booking.id }, { status: 201 })
}
