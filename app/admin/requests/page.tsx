import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-sky-100 text-sky-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  processing: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-200 text-slate-600',
}

const TYPE_LABELS: Record<string, string> = {
  custom_package: '📦 Package',
  visa: '🛂 Visa',
  ticket: '🎫 Ticket',
  hotel: '🏨 Hotel',
  transport: '🚌 Transport',
  insurance: '🛡️ Insurance',
  ziyarat: '🕌 Ziyarat',
  tour: '🌍 Tour',
  other: '✨ Other',
}

export default async function AdminRequests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('requests')
    .select('id, request_type, title, destination, client_name, client_phone, pax_count, budget, currency, status, created_at, agents(full_name, email)')
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data: requests } = await query

  const filters = ['', 'submitted', 'under_review', 'processing', 'approved', 'completed', 'rejected']

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Package &amp; Service Requests</h1>
      <p className="text-sm text-slate-500">Requests submitted by agents. Open one to process it.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f || 'all'}
            href={f ? `/admin/requests?status=${f}` : '/admin/requests'}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              (status ?? '') === f ? 'bg-gold text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'
            }`}
          >
            {f ? f.replace('_', ' ') : 'All'}
          </Link>
        ))}
      </div>

      {!requests || requests.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white py-16 text-center shadow-card">
          <div className="text-4xl">📬</div>
          <h3 className="mt-3 font-display text-lg font-semibold">No requests found</h3>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Agent</th>
                <th className="p-3">Client</th>
                <th className="p-3">PAX</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{r.title}<div className="text-xs text-slate-400">{r.destination}</div></td>
                  <td className="p-3">{TYPE_LABELS[r.request_type] ?? r.request_type}</td>
                  <td className="p-3">{r.agents?.full_name ?? '—'}</td>
                  <td className="p-3">{r.client_name ?? '—'}</td>
                  <td className="p-3">{r.pax_count}</td>
                  <td className="p-3">{r.budget ? `${r.currency} ${Number(r.budget).toLocaleString()}` : '—'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {String(r.status).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3"><Link href={`/admin/requests/${r.id}`} className="font-semibold text-gold">Process →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
