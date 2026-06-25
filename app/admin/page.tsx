import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-sky-100 text-sky-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  processing: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-200 text-slate-600',
}

async function count(supabase: any, table: string, build?: (q: any) => any) {
  let q = supabase.from(table).select('id', { count: 'exact', head: true })
  if (build) q = build(q)
  const { count } = await q
  return count ?? 0
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [pendingReq, totalReq, agents, pendingPnrs, activeNews] = await Promise.all([
    count(supabase, 'requests', (q) => q.in('status', ['submitted', 'under_review', 'processing'])),
    count(supabase, 'requests'),
    count(supabase, 'agents'),
    count(supabase, 'pnrs', (q) => q.eq('status', 'pending')),
    count(supabase, 'announcements'),
  ])

  const { data: recent } = await supabase
    .from('requests')
    .select('id, request_type, title, client_name, status, created_at, agents(full_name)')
    .order('created_at', { ascending: false })
    .limit(8)

  const stats = [
    { label: 'Pending Requests', value: pendingReq, href: '/admin/requests', accent: 'text-amber-600' },
    { label: 'Total Requests', value: totalReq, href: '/admin/requests', accent: 'text-ink' },
    { label: 'Agents', value: agents, href: '/admin/agents', accent: 'text-ink' },
    { label: 'Pending PNRs', value: pendingPnrs, href: '/admin/pnrs', accent: 'text-red-600' },
    { label: 'Announcements', value: activeNews, href: '/admin/announcements', accent: 'text-sky-600' },
  ]

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-sm text-slate-500">Process agent requests and manage workspace communications.</p>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl bg-white p-5 shadow-card transition hover:shadow-lg">
            <div className={`font-display text-3xl font-extrabold ${s.accent}`}>{s.value}</div>
            <div className="mt-1 text-sm text-slate-500">{s.label}</div>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Latest Requests</h2>
          <Link href="/admin/requests" className="text-sm font-semibold text-gold">View all →</Link>
        </div>
        {!recent || recent.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="p-2">Title</th>
                  <th className="p-2">Agent</th>
                  <th className="p-2">Client</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Submitted</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">{r.title}</td>
                    <td className="p-2">{r.agents?.full_name ?? '—'}</td>
                    <td className="p-2">{r.client_name ?? '—'}</td>
                    <td className="p-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {String(r.status).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-2 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-2"><Link href={`/admin/requests/${r.id}`} className="font-semibold text-gold">Process →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
