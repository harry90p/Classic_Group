import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { isSupabaseConfigured, isBootstrapAdminEmail } from '../../lib/supabase/env'

// Server-side landing route used right after sign-in. It reads the user's role
// from their session (reliable, no client-side race) and sends them to the
// correct home WITHOUT ever changing host — so the session cookie stays valid.
export const dynamic = 'force-dynamic'

export default async function PostLogin() {
  if (!isSupabaseConfigured) redirect('/login')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('role, status')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // Admins (limited or super) go straight to the console. A recognized
  // bootstrap admin email is always routed to the console too.
  if (agent?.role === 'admin' || isBootstrapAdminEmail(user.email)) redirect('/admin')
  // Everyone else lands in the portal; the portal layout shows a pending /
  // suspended notice until the super-admin approves the account.
  redirect('/dashboard')
}
