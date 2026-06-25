import { createClient } from '../../../lib/supabase/server'

export default async function AdminPnrs() {
  const supabase = await createClient()
  const { data: pnrs } = await supabase
    .from('pnrs')
    .select('id, pnr_code, airline, source, status, expiry_at, agents(full_name)')
    .order('expiry_at', { ascending: true })
    .limit(200)

  const now = Date.now()

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">PNR Overview</h1>
      <p className="text-sm text-slate-500">All PNRs across agents and sources. Payment reminders auto-fire at T-48h and T-24h.</p>

      {!pnrs || pnrs.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white py-16 text-center shadow-card">
          <div className="text-4xl">📅</div>
          <h3 className="mt-3 font-display text-lg font-semibold">No PNRs yet</h3>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="p-3">PNR</th>
                <th className="p-3">Airline</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Source</th>
                <th className="p-3">Status</th>
                <th className="p-3">Expires</th>
              </tr>
            </thead>
            <tbody>
              {pnrs.map((p: any) => {
                const exp = p.expiry_at ? new Date(p.expiry_at).getTime() : null
                const soon = exp !== null && p.status === 'pending' && exp - now <= 2 * 86400_000
                return (
                  <tr key={p.id} className={`border-b last:border-0 ${soon ? 'bg-red-50' : ''}`}>
                    <td className="p-3 font-mono">{p.pnr_code}</td>
                    <td className="p-3">{p.airline || '—'}</td>
                    <td className="p-3">{p.agents?.full_name ?? '—'}</td>
                    <td className="p-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{p.source}</span></td>
                    <td className="p-3 capitalize">{p.status}</td>
                    <td className={`p-3 ${soon ? 'font-semibold text-red-600' : ''}`}>{p.expiry_at ? new Date(p.expiry_at).toLocaleString() : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
