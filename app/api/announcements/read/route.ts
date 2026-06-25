import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { isSupabaseConfigured } from '../../../../lib/supabase/env'

// Marks one or more announcements as read for the current agent.
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: false }, { status: 503 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.length) return NextResponse.json({ ok: true })

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

  const rows = ids.map((id) => ({ announcement_id: id, agent_id: agent.id }))
  const { error } = await supabase
    .from('announcement_reads')
    .upsert(rows, { onConflict: 'announcement_id,agent_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
