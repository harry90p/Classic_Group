import { createClient } from '../../../lib/supabase/server'

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-ink text-white',
  agent: 'bg-gold/15 text-gold-dark',
  sub_agent: 'bg-slate-200 text-slate-600',
}

export default async function AdminAgents() {
  const supabase = await createClient()
  const { data: agents } = await supabase
    .from('agents')
    .select('id, full_name, email, whatsapp_number, role, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Agents</h1>
      <p className="text-sm text-slate-500">All registered agents in the workspace.</p>

      {!agents || agents.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white py-16 text-center shadow-card">
          <div className="text-4xl">👥</div>
          <h3 className="mt-3 font-display text-lg font-semibold">No agents yet</h3>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">WhatsApp</th>
                <th className="p-3">Role</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{a.full_name}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3">{a.whatsapp_number || '—'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_STYLES[a.role] ?? 'bg-slate-100'}`}>
                      {String(a.role).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
