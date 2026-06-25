import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { isSupabaseConfigured, COMPANY_EMAIL_DOMAIN } from '../../../lib/supabase/env'
import UserManager, { type ManagedUser } from '../../../components/admin/UserManager'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <p className="text-sm text-slate-500">Supabase is not configured.</p>
      </div>
    )
  }

  // Super-admin gate (admin layout already ensures role === 'admin').
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caller } = await supabase
    .from('agents')
    .select('is_super_admin')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!caller || caller.is_super_admin !== true) redirect('/admin')

  // Load every user (service role bypasses RLS).
  const { data: rows } = await supabaseAdmin
    .from('agents')
    .select(
      'id, full_name, email, whatsapp_number, agent_code, role, status, is_super_admin, created_at',
    )
    .order('created_at', { ascending: false })

  const all = (rows ?? []) as ManagedUser[]
  const pending = all.filter((u) => u.role !== 'admin' && u.status === 'pending')
  const admins = all.filter((u) => u.role === 'admin')
  const agents = all.filter((u) => u.role !== 'admin' && u.status !== 'pending')

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Approve agent registrations, and grant limited admin access to official
          @{COMPANY_EMAIL_DOMAIN} staff.
        </p>
      </div>
      <UserManager
        pending={pending}
        admins={admins}
        agents={agents}
        companyDomain={COMPANY_EMAIL_DOMAIN}
      />
    </div>
  )
}
