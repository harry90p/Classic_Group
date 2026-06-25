import { createClient } from '../../../lib/supabase/server'
import TicketDownload from '../../../components/portal/TicketDownload'

const STATUS_TONE: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  reserved: 'bg-amber-50 text-amber-700',
  issued: 'bg-green-50 text-green-700',
  ticketed: 'bg-green-50 text-green-700',
  expired: 'bg-red-50 text-red-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default async function PnrsPage() {
  const supabase = await createClient()
  const { data: pnrs } = await supabase
    .from('pnrs')
    .select('id, pnr_code, airline, status, source, expiry_at, ticket_number')
    .order('expiry_at', { ascending: true })

  // Tickets the agent can download (RLS already scopes to the agent).
  const { data: tickets } = await supabase
    .from('ticket_documents')
    .select('id, pnr_id, passenger_name, ticket_number')

  const ticketsByPnr = new Map<string, any[]>()
  for (const t of tickets ?? []) {
    const list = ticketsByPnr.get(t.pnr_id) ?? []
    list.push(t)
    ticketsByPnr.set(t.pnr_id, list)
  }

  return (
    <main className="p-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">My Reservations &amp; PNRs</h1>
        <p className="text-sm text-slate-500">Reservations are created by Classic Group and shared here automatically once confirmed — including your ticketing deadline and e-tickets.</p>
      </div>

      {(!pnrs || pnrs.length === 0) ? (
        <p className="text-slate-500">No reservations yet. When the admin reserves a booking for you, its PNR and ticketing deadline appear here.</p>
      ) : (
        <div className="space-y-3">
          {pnrs.map((p: any) => {
            const tone = STATUS_TONE[p.status] ?? 'bg-slate-100 text-slate-600'
            const docs = ticketsByPnr.get(p.id) ?? []
            return (
              <div key={p.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-lg font-semibold">{p.pnr_code}</span>
                    {p.airline && <span className="ml-2 text-sm text-slate-500">{p.airline}</span>}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone}`}>{p.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                  <span>Ticketing deadline: <strong>{p.expiry_at ? new Date(p.expiry_at).toLocaleString() : '—'}</strong></span>
                  {p.ticket_number && <span>Ticket: <span className="font-mono">{p.ticket_number}</span></span>}
                </div>
                {docs.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-1 text-xs font-semibold text-slate-500">E-tickets</p>
                    <ul className="space-y-1">
                      {docs.map((d: any) => (
                        <li key={d.id} className="flex items-center justify-between text-sm">
                          <span>{d.passenger_name ?? 'Passenger'} · <span className="font-mono text-xs">{d.ticket_number}</span></span>
                          <TicketDownload ticketId={d.id} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
