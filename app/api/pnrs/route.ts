import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { manualPnrSchema } from '../../../lib/validation/pnr'
import { isSupabaseConfigured } from '../../../lib/supabase/env'

// Option A — create/update a manually-entered PNR.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = manualPnrSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Supabase not configured. Add keys to .env.local.' },
      { status: 503 },
    )
  }
  const form = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!agent) return NextResponse.json({ error: 'No agent profile' }, { status: 403 })

  // Creating/editing PNRs is an admin-only action. Agents receive reservations
  // automatically once an admin reserves their booking — they cannot add PNRs.
  if (agent.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only Classic Group admins can add or edit PNRs.' },
      { status: 403 },
    )
  }

  const { error } = await supabase.from('pnrs').upsert(
    {
      agent_id: form.agentId ?? agent.id,
      pnr_code: form.pnrCode,
      airline: form.airline ?? null,
      status: form.status,
      source: 'manual',
      booking_id: form.bookingId ?? null,
      booking_at: form.bookingAt || null,
      issuance_at: form.issuanceAt || null,
      expiry_at: form.expiryAt,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: 'source,pnr_code' },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
