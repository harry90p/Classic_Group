import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { isSupabaseConfigured, isBootstrapAdminEmail } from '../../lib/supabase/env'
import { supabaseAdmin } from '../../lib/supabase/admin'
import AdminShell from '../../components/admin/AdminShell'
import LogoutButton from '../../components/portal/LogoutButton'

// Shown when a signed-in NON-admin lands on the admin console. We render this
// instead of redirecting so the admin subdomain (which bounces agent routes
// back to /admin) can never enter a redirect loop.
function AdminAccessDenied({ email }: { email: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ink p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
        <img src="/assets/img/logos/logo-navbar.png" alt="Classic Group of Travels" className="mx-auto h-10 w-auto" />
        <div className="mt-6 text-5xl">🔒</div>
        <h1 className="mt-4 font-display text-xl font-bold text-ink">Staff access only</h1>
        <p className="mt-3 text-sm text-slate-600">
          This is the Classic Group admin console. Your account doesn’t have admin
          access. If you’re a travel partner, please use the agent portal on the
          main site instead.
        </p>
        <p className="mt-4 text-xs text-slate-400">Signed in as {email}</p>
        <div className="mt-6">
          <LogoutButton className="inline-block rounded-lg bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-ink/90" />
        </div>
      </div>
    </main>
  )
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-xl p-10">
        <h1 className="mb-3 font-display text-2xl font-semibold">Connect Supabase first</h1>
        <p className="text-slate-600">
          The admin panel needs Supabase configured. Add your keys to <code>.env.local</code> and restart.
        </p>
      </main>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: agent } = await supabase
    .from('agents')
    .select('full_name, role, is_super_admin')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // Bootstrap admin: a recognized admin email is ALWAYS granted access, and we
  // self-heal its agent row to admin via the service-role client in whichever
  // project this app is actually connected to. This guarantees the owner can
  // always get in, even if a seed/migration/project mixup left the row wrong.
  if (isBootstrapAdminEmail(user.email)) {
    if (!agent || agent.role !== 'admin' || agent.is_super_admin !== true) {
      await supabaseAdmin.from('agents').upsert(
        {
          auth_user_id: user.id,
          email: user.email ?? null,
          full_name: agent?.full_name ?? 'Super Admin',
          role: 'admin',
          is_super_admin: true,
          status: 'active',
        },
        { onConflict: 'auth_user_id' },
      )
      agent = {
        full_name: agent?.full_name ?? 'Super Admin',
        role: 'admin',
        is_super_admin: true,
      }
    }
  }

  // Only admins (limited or super) may enter the admin panel. Non-admins get a
  // clear notice (NOT a redirect) so the admin subdomain stays loop-free.
  if (!agent || agent.role !== 'admin') {
    return <AdminAccessDenied email={user.email ?? ''} />
  }

  const { count } = await supabase
    .from('requests')
    .select('id', { count: 'exact', head: true })
    .in('status', ['submitted', 'under_review', 'processing'])

  return (
    <AdminShell
      email={user.email ?? ''}
      adminName={agent.full_name ?? ''}
      pendingCount={count ?? 0}
      isSuperAdmin={agent.is_super_admin === true}
    >
      {children}
    </AdminShell>
  )
}
