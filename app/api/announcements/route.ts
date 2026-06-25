import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { announcementSchema } from '../../../lib/validation/announcement'
import { isSupabaseConfigured } from '../../../lib/supabase/env'

// Create an announcement (admins only).
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = announcementSchema.safeParse(body)
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
  if (agent.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 })

  const a = parsed.data
  const { error } = await supabase.from('announcements').insert({
    title: a.title,
    body: a.body ?? null,
    level: a.level,
    audience: a.audience,
    ends_at: a.endsAt || null,
    created_by: agent.id,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
