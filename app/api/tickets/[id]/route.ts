import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { supabaseAdmin } from '../../../../lib/supabase/admin'
import { signedTicketUrl } from '../../../../lib/storage/tickets'
import { isSupabaseConfigured } from '../../../../lib/supabase/env'

// Agent (owner) or admin downloads an issued e-ticket.
// Returns a short-lived signed URL; the bucket itself stays private.
export async function GET(
  _req: Request,
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

  const { data: me } = await supabase
    .from('agents')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!me) return NextResponse.json({ error: 'No agent profile' }, { status: 403 })

  const { data: doc } = await supabaseAdmin
    .from('ticket_documents')
    .select('id, agent_id, doc_path')
    .eq('id', id)
    .maybeSingle()
  if (!doc || !doc.doc_path)
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  // Only the owning agent or an admin may download.
  if (me.role !== 'admin' && doc.agent_id !== me.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const url = await signedTicketUrl(doc.doc_path, 120)
  if (!url) return NextResponse.json({ error: 'Could not sign URL' }, { status: 500 })
  return NextResponse.json({ url }, { status: 200 })
}
