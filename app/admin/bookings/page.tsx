import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export const dynamic = 'force-dynamic'

const STATUS_TONE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  quoted: 'bg-blue-50 text-blue-700',
  reserved: 'bg-amber-50 text-amber-700',
  ticketed: 'bg-green-50 text-green-700',
  expired: 'bg-red-50 text-red-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default async function AdminBookings() {
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('group_bookings')
    .select('id, reference, airline, origin, destination, travel_date, pax_count, status, fare_total, amount_received, payment_status, currency, created_at, agents:agent_id(full_name, agent_code)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Group Bookings</h1>
      <p className="text-sm text-slate-500">Every reservation created from an agent request, with its airline, route and ticketing status.</p>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-card">
        {(!bookings || bookings.length === 0) ? (
          <p className="py-8 text-center text-slate-400">No group bookings yet. They are created when you reserve a package request.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="p-2">Reference</th>
                  <th className="p-2">Agent</th>
                  <th className="p-2">Route</th>
                  <th className="p-2">Travel date</th>
                  <th className="p-2">PAX</th>
                  <th className="p-2">Fare</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Status</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="p-2 font-mono text-xs">{b.reference ?? b.id.slice(0, 8)}</td>
                    <td className="p-2">{b.agents?.full_name ?? '—'}{b.agents?.agent_code ? ` (${b.agents.agent_code})` : ''}</td>
                    <td className="p-2">{[b.origin, b.destination].filter(Boolean).join(' → ') || '—'}{b.airline ? ` · ${b.airline}` : ''}</td>
                    <td className="p-2 text-slate-500">{b.travel_date ? new Date(b.travel_date).toLocaleDateString() : '—'}</td>
                    <td className="p-2">{b.pax_count}</td>
                    <td className="p-2">{b.fare_total != null ? `${b.currency} ${Number(b.fare_total).toLocaleString()}` : '—'}</td>
                    <td className="p-2">{(() => {
                      const total = Number(b.fare_total ?? 0)
                      const recv = Number(b.amount_received ?? 0)
                      const remaining = Math.max(0, total - recv)
                      if (total <= 0) return <span className="text-slate-400">—</span>
                      if (remaining <= 0) return <span className="font-semibold text-green-600">Paid</span>
                      return <span className="font-semibold text-red-600">{b.currency} {remaining.toLocaleString()} left</span>
                    })()}</td>
                    <td className="p-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_TONE[b.status] ?? 'bg-slate-100 text-slate-600'}`}>{b.status}</span>
                    </td>
                    <td className="p-2">
                      <Link href={`/admin/bookings/${b.id}`} className="font-semibold text-gold hover:underline">Manage →</Link>
                    </td>
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
