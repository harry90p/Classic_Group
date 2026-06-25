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
  custom_package: '📦 Custom Package',
  visa: '🛂 Visa',
  ticket: '🎫 Ticket',
  hotel: '🏨 Hotel',
  transport: '🚌 Transport',
  insurance: '🛡️ Insurance',
  ziyarat: '🕌 Ziyarat',
  tour: '🌍 Tour',
  other: '✨ Other',
}

export default async function PackagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: requests } = user
    ? await supabase
        .from('requests')
        .select('id, request_type, title, destination, client_name, pax_count, status, admin_notes, created_at')
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">My Packages &amp; Requests</h1>
          <p className="text-sm text-slate-500">Custom packages and services you have submitted for processing.</p>
        </div>
        <Link href="/packages/new" className="btn-gold">➕ Create Custom Package</Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-card">
          <div className="text-4xl">📦</div>
          <h3 className="mt-3 font-display text-lg font-semibold">No requests yet</h3>
          <p className="mt-1 text-sm text-slate-500">Create a custom package for your client to get started.</p>
          <Link href="/packages/new" className="btn-gold mt-5 inline-block">Create your first package</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-500">
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Client</th>
                <th className="p-3">PAX</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="p-3 font-medium">
                    {r.title}
                    {r.admin_notes && (
                      <div className="mt-1 text-xs text-slate-500">📝 {r.admin_notes}</div>
                    )}
                  </td>
                  <td className="p-3">{TYPE_LABELS[r.request_type] ?? r.request_type}</td>
                  <td className="p-3">{r.destination || '—'}</td>
                  <td className="p-3">{r.client_name || '—'}</td>
                  <td className="p-3">{r.pax_count}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {String(r.status).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
