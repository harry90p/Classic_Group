import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { isSupabaseConfigured } from '../../lib/supabase/env'
import PortalShell from '../../components/portal/PortalShell'
import LogoutButton from '../../components/portal/LogoutButton'

// Shown to agents whose account is not yet approved (or was suspended/rejected).
function AccountStatusScreen({ status, email }: { status: string; email: string }) {
  const copy: Record<string, { icon: string; title: string; body: string; tone: string }> = {
    pending: {
      icon: '⏳',
      title: 'Your account is awaiting approval',
      body: 'Thanks for registering. A Classic Group administrator will review and approve your account shortly. You’ll be able to access the agent portal as soon as it’s approved.',
      tone: 'text-amber-600',
    },
    suspended: {
      icon: '🚫',
      title: 'Your account is suspended',
      body: 'Access to the agent portal has been temporarily suspended. Please contact Classic Group of Travels for assistance.',
      tone: 'text-red-600',
    },
    rejected: {
      icon: '⛔',
      title: 'Your registration was not approved',
      body: 'Unfortunately your account request was not approved. If you believe this is a mistake, please contact Classic Group of Travels.',
      tone: 'text-red-600',
    },
  }
  const c = copy[status] ?? copy.pending
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
        <img src="/assets/img/logos/logo-navbar.png" alt="Classic Group of Travels" className="mx-auto h-10 w-auto" />
        <div className="mt-6 text-5xl">{c.icon}</div>
        <h1 className={`mt-4 font-display text-xl font-bold ${c.tone}`}>{c.title}</h1>
        <p className="mt-3 text-sm text-slate-600">{c.body}</p>
        <p className="mt-4 text-xs text-slate-400">Signed in as {email}</p>
        <div className="mt-6">
          <LogoutButton className="inline-block rounded-lg bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-ink/90" />
        </div>
      </div>
    </main>
  )
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Friendly setup screen until Supabase keys are configured.
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-xl p-10">
        <h1 className="mb-3 font-display text-2xl font-semibold">Almost there — connect Supabase</h1>
        <p className="mb-4 text-slate-600">
          The portal needs a Supabase project. Add these to a <code>.env.local</code> file in the project root,
          then restart <code>npm run dev</code>:
        </p>
        <pre className="rounded bg-ink p-4 text-sm text-slate-100">{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY`}</pre>
        <p className="mt-4 text-sm text-slate-500">Find both at Supabase → Project → Settings → API.</p>
      </main>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('full_name, role, status')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // Approval gate — agents must be approved by the super-admin before the
  // portal unlocks. Admins (limited or super) always have access.
  const isAdmin = agent?.role === 'admin'
  const status = agent?.status ?? 'pending'
  if (!isAdmin && status !== 'active') {
    return <AccountStatusScreen status={status} email={user.email ?? ''} />
  }

  return (
    <PortalShell
      email={user.email ?? ''}
      agentName={agent?.full_name ?? ''}
      isAdmin={isAdmin}
    >
      {children}
    </PortalShell>
  )
}
