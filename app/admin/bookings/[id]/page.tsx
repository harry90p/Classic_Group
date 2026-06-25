import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '../../../../lib/supabase/admin'
import { isSupabaseConfigured } from '../../../../lib/supabase/env'
import BookingManager, {
  type BookingRow,
  type PaxRow,
} from '../../../../components/admin/BookingManager'

export const dynamic = 'force-dynamic'

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone ?? 'text-ink'}`}>{value}</p>
    </div>
  )
}

export default async function AdminBookingDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!isSupabaseConfigured) {
    return <div className="p-6 text-sm text-slate-500">Supabase is not configured.</div>
  }

  const { data: booking } = await supabaseAdmin
    .from('group_bookings')
    .select(
      'id, reference, airline, origin, destination, travel_date, pax_count, capacity, status, currency, pnr_code, fare_adt, fare_chd, fare_inf, fare_total, amount_received, payment_status, admin_notes, agent_id',
    )
    .eq('id', id)
    .maybeSingle()
  if (!booking) notFound()

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('full_name, agent_code, email')
    .eq('id', booking.agent_id)
    .maybeSingle()

  const { data: passengers } = await supabaseAdmin
    .from('passengers')
    .select(
      'id, title, first_name, last_name, pax_type, dob, passport_no, passport_expiry, hold, hold_until, hold_reason, ticket_number, issued',
    )
    .eq('booking_id', id)
    .order('created_at', { ascending: true })

  const cur = booking.currency || 'PKR'
  const fareTotal = Number(booking.fare_total ?? 0)
  const received = Number(booking.amount_received ?? 0)
  const remaining = Math.max(0, fareTotal - received)

  return (
    <div className="p-4 sm:p-6">
      <Link href="/admin/bookings" className="text-sm text-slate-500 hover:text-ink">
        ← Back to Group Bookings
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">
          {booking.reference ?? booking.id.slice(0, 8)}
        </h1>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
          {booking.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {[booking.origin, booking.destination].filter(Boolean).join(' → ') || '—'}
        {booking.airline ? ` · ${booking.airline}` : ''}
        {booking.travel_date ? ` · ${new Date(booking.travel_date).toLocaleDateString()}` : ''}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Agent" value={`${agent?.full_name ?? '—'}${agent?.agent_code ? ` (${agent.agent_code})` : ''}`} />
        <Card label="Group capacity" value={`${booking.capacity ?? '—'} (${booking.pax_count} pax)`} />
        <Card label="Group total" value={`${cur} ${fareTotal.toLocaleString()}`} />
        <Card
          label="Remaining"
          value={`${cur} ${remaining.toLocaleString()}`}
          tone={remaining > 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      <div className="mt-6">
        <BookingManager
          booking={booking as unknown as BookingRow}
          passengers={(passengers ?? []) as unknown as PaxRow[]}
        />
      </div>
    </div>
  )
}
