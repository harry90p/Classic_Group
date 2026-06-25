import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { supabaseAdmin } from '../../../../../lib/supabase/admin'
import { passengerHoldSchema } from '../../../../../lib/validation/booking'
import { isSupabaseConfigured } from '../../../../../lib/supabase/env'
import { notifyAgent } from '../../../../../lib/notify'

// ADMIN: hold (or release) ticket issuance for a single passenger.
// Agents sometimes ask to hold issuance for some of their client passengers;
// the admin sets the hold flag, an optional hold-until date and a reason.
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
  const parsed = passengerHoldSchema.safeParse(body)
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

  const { hold, holdUntil, holdReason } = parsed.data

  const { data: passenger, error: upErr } = await supabaseAdmin
    .from('passengers')
    .update({
      hold,
      hold_until: hold ? (holdUntil ?? null) : null,
      hold_reason: hold ? (holdReason ?? null) : null,
    })
    .eq('id', id)
    .select('id, first_name, last_name, booking_id')
    .single()
  if (upErr || !passenger)
    return NextResponse.json({ error: upErr?.message ?? 'Passenger not found' }, { status: 404 })

  // Notify the owning agent that issuance for this passenger was held / released.
  try {
    const { data: booking } = await supabaseAdmin
      .from('group_bookings')
      .select('agent_id, reference')
      .eq('id', passenger.booking_id)
      .maybeSingle()
    if (booking?.agent_id) {
      const name = `${passenger.first_name} ${passenger.last_name}`.trim()
      await notifyAgent({
        agentId: booking.agent_id,
        title: hold ? 'Ticket issuance held' : 'Ticket hold released',
        body: hold
          ? `Issuance for ${name} is on hold${holdUntil ? ` until ${holdUntil}` : ''}.` +
            (holdReason ? ` Reason: ${holdReason}.` : '')
          : `The issuance hold for ${name} has been released.`,
      })
    }
  } catch {
    // best-effort
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
