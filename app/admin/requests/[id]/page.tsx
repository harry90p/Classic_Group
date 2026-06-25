import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import RequestProcessPanel from '../../../../components/admin/RequestProcessPanel'

const TYPE_LABELS: Record<string, string> = {
  custom_package: '📦 Custom Package',
  visa: '🛂 Visa',
  ticket: '🎫 Air Ticket',
  hotel: '🏨 Hotel',
  transport: '🚌 Transport',
  insurance: '🛡️ Travel Insurance',
  ziyarat: '🕌 Ziyarat',
  tour: '🌍 Tour',
  other: '✨ Other',
}

const STATUS_TONE: Record<string, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  under_review: 'bg-blue-50 text-blue-700',
  reserved: 'bg-amber-50 text-amber-700',
  issued: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-red-50 text-red-700',
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: r } = await supabase
    .from('requests')
    .select('*, agents:agent_id(full_name, email, whatsapp_number, agent_code, virtual_account_no), pnrs:pnr_id(id, pnr_code, airline, status, expiry_at, segments, ticket_number)')
    .eq('id', id)
    .maybeSingle()

  if (!r) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('amount, currency, payer_name, bank_ref, received_at')
    .eq('request_id', id)
    .order('received_at', { ascending: false })

  const { data: tickets } = await supabase
    .from('ticket_documents')
    .select('id, passenger_name, ticket_number, source, created_at')
    .eq('request_id', id)

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : null)
  const pnr = (r as any).pnrs
  const tone = STATUS_TONE[r.status] ?? 'bg-slate-100 text-slate-700'
  const money = {
    fareTotal: r.fare_total != null ? Number(r.fare_total) : null,
    amountReceived: Number(r.amount_received ?? 0),
    paymentStatus: r.payment_status ?? 'unpaid',
    currency: r.currency ?? 'PKR',
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Link href="/admin/requests" className="text-sm font-semibold text-gold">← All requests</Link>
          <h1 className="mt-1 font-display text-2xl font-bold">{r.title}</h1>
          <p className="text-sm text-slate-500">{TYPE_LABELS[r.request_type] ?? r.request_type}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${tone}`}>{String(r.status).replace('_', ' ')}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Reservation (shown once a PNR is attached) */}
          {pnr && (
            <section className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
              <h2 className="mb-3 font-display text-lg font-bold">Reservation</h2>
              <Row label="PNR" value={pnr.pnr_code} />
              <Row label="Airline" value={pnr.airline} />
              <Row label="PNR status" value={pnr.status} />
              <Row label="Ticketing time limit" value={pnr.expiry_at ? new Date(pnr.expiry_at).toLocaleString() : null} />
              <Row label="Ticket number" value={pnr.ticket_number} />
            </section>
          )}

          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold">Package details</h2>
            <Row label="Destination" value={r.destination} />
            <Row label="Travellers (PAX)" value={r.pax_count} />
            <Row label="Departure" value={fmtDate(r.departure_date)} />
            <Row label="Return" value={fmtDate(r.return_date)} />
            <Row label="Nights" value={r.nights} />
            <Row label="Hotel" value={r.hotel} />
            <Row label="Transport" value={r.transport} />
            <Row label="Inclusions" value={r.inclusions} />
            <Row label="Budget" value={r.budget ? `${r.currency} ${Number(r.budget).toLocaleString()}` : null} />
            <Row label="Notes" value={r.notes} />
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold">Client &amp; agent</h2>
            <Row label="Client name" value={r.client_name} />
            <Row label="Client phone" value={r.client_phone} />
            <Row label="Submitted by" value={r.agents?.full_name} />
            <Row label="Agent code" value={r.agents?.agent_code} />
            <Row label="Virtual account" value={r.agents?.virtual_account_no} />
            <Row label="Agent email" value={r.agents?.email} />
            <Row label="Agent WhatsApp" value={r.agents?.whatsapp_number} />
            <Row label="Submitted on" value={new Date(r.created_at).toLocaleString()} />
          </section>

          {/* Payments received (auto via bank API) */}
          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold">Payments received</h2>
            {(!payments || payments.length === 0) ? (
              <p className="text-sm text-slate-400">No payments matched to this request yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-slate-500"><th className="py-1">Date</th><th>Payer</th><th>Ref</th><th className="text-right">Amount</th></tr></thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.bank_ref} className="border-b border-slate-50">
                      <td className="py-1">{new Date(p.received_at).toLocaleDateString()}</td>
                      <td>{p.payer_name ?? '—'}</td>
                      <td className="font-mono text-xs">{p.bank_ref}</td>
                      <td className="text-right font-medium">{p.currency} {Number(p.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Issued e-tickets */}
          {tickets && tickets.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-card">
              <h2 className="mb-3 font-display text-lg font-bold">Issued e-tickets</h2>
              <ul className="space-y-2">
                {tickets.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span>{t.passenger_name ?? 'Passenger'} · <span className="font-mono">{t.ticket_number}</span> <span className="text-xs text-slate-400">({t.source})</span></span>
                    <a href={`/api/tickets/${t.id}`} className="text-sm font-semibold text-gold" target="_blank" rel="noreferrer">Download</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Process panel */}
        <div className="lg:col-span-1">
          <section className="sticky top-20 rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-3 font-display text-lg font-bold">Process request</h2>
            <RequestProcessPanel
              id={r.id}
              status={r.status}
              pnrCode={pnr?.pnr_code ?? null}
              pnrId={pnr?.id ?? null}
              expiryAt={pnr?.expiry_at ?? null}
              money={money}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
