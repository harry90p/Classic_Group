import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { requestSchema } from '../../../lib/validation/request'
import { isSupabaseConfigured } from '../../../lib/supabase/env'

// Agent creates a service / custom-package request from their portal.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = requestSchema.safeParse(body)
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

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!agent) return NextResponse.json({ error: 'No agent profile' }, { status: 403 })

  const r = parsed.data
  const { data, error } = await supabase
    .from('requests')
    .insert({
      agent_id: agent.id,
      request_type: r.requestType,
      title: r.title,
      destination: r.destination ?? null,
      client_name: r.clientName ?? null,
      client_phone: r.clientPhone ?? null,
      pax_count: r.paxCount,
      departure_date: r.departureDate || null,
      return_date: r.returnDate || null,
      nights: r.nights ?? null,
      hotel: r.hotel ?? null,
      transport: r.transport ?? null,
      inclusions: r.inclusions ?? null,
      budget: r.budget ?? null,
      currency: r.currency,
      notes: r.notes ?? null,
      status: 'submitted',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, requestId: data.id }, { status: 201 })
}
