import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { requestUpdateSchema } from '../../../../lib/validation/request'
import { isSupabaseConfigured } from '../../../../lib/supabase/env'

// Admin processes a request: change status + add admin notes.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = requestUpdateSchema.safeParse(body)
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
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!agent) return NextResponse.json({ error: 'No agent profile' }, { status: 403 })
  if (agent.role !== 'admin')
    return NextResponse.json({ error: 'Admins only' }, { status: 403 })

  const { status, adminNotes } = parsed.data
  const { error } = await supabase
    .from('requests')
    .update({
      status,
      admin_notes: adminNotes ?? null,
      processed_by: agent.id,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
