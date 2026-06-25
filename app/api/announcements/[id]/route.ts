import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { isSupabaseConfigured } from '../../../../lib/supabase/env'

// Admin deletes an announcement / newsletter item.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
