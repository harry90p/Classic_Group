import { createClient } from '../../lib/supabase/server'
import { SUPABASE_URL, isSupabaseConfigured } from '../../lib/supabase/env'

// TEMPORARY DEBUG PAGE. Visit /whoami while logged in to see exactly what the
// running app sees. Delete this file once the admin login works.
export const dynamic = 'force-dynamic'

export default async function WhoAmI() {
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0]
  const out: Record<string, unknown> = { projectRef, isSupabaseConfigured }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    out.session = user ? { id: user.id, email: user.email } : 'NO SESSION (not logged in)'

    if (user) {
      const byId = await supabase
        .from('agents')
        .select('email, role, is_super_admin, status, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      out.agentRowTheAppReads = byId.data ?? null
      out.agentRowError = byId.error ? byId.error.message : null
    }

    const byEmail = await supabase
      .from('agents')
      .select('email, role, is_super_admin, status, auth_user_id')
      .ilike('email', 'admin@classicgroupoftravels.com')
    out.allAgentsWithAdminEmail = byEmail.data ?? null
    out.byEmailError = byEmail.error ? byEmail.error.message : null
  } catch (e) {
    out.fatalError = e instanceof Error ? e.message : String(e)
  }

  const mainStyle = { padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap' as const }
  const titleStyle = { fontWeight: 700, marginBottom: 12 }
  return (
    <main style={mainStyle}>
      <h1 style={titleStyle}>whoami debug</h1>
      <pre>{JSON.stringify(out, null, 2)}</pre>
    </main>
  )
}
