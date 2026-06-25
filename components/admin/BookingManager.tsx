'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type PaxRow = {
  id: string
  title: string | null
  first_name: string
  last_name: string
  pax_type: string
  dob: string | null
  passport_no: string | null
  passport_expiry: string | null
  hold: boolean
  hold_until: string | null
  hold_reason: string | null
  ticket_number: string | null
  issued: boolean
}

export type BookingRow = {
  id: string
  currency: string
  status: string
  pnr_code: string | null
  fare_adt: number | null
  fare_chd: number | null
  fare_inf: number | null
  fare_total: number | null
  amount_received: number | null
  payment_status: string
  admin_notes: string | null
}

const field =
  'rounded-lg border border-slate-300 p-2 text-sm focus:border-gold focus:outline-none'

export default function BookingManager({
  booking,
  passengers,
}: {
  booking: BookingRow
  passengers: PaxRow[]
}) {
  const router = useRouter()
  const cur = booking.currency || 'PKR'

  // ---- Quote form state ------------------------------------------------
  const [pnrCode, setPnrCode] = useState(booking.pnr_code ?? '')
  const [fareAdt, setFareAdt] = useState(String(booking.fare_adt ?? ''))
  const [fareChd, setFareChd] = useState(String(booking.fare_chd ?? ''))
  const [fareInf, setFareInf] = useState(String(booking.fare_inf ?? ''))
  const [amountReceived, setAmountReceived] = useState(String(booking.amount_received ?? ''))
  const [expiryAt, setExpiryAt] = useState('')
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Live total preview from the manifest.
  const counts = passengers.reduce(
    (acc, p) => {
      const t = p.pax_type === 'CHD' ? 'CHD' : p.pax_type === 'INF' ? 'INF' : 'ADT'
      acc[t] += 1
      return acc
    },
    { ADT: 0, CHD: 0, INF: 0 } as Record<string, number>,
  )
  const previewTotal =
    counts.ADT * (Number(fareAdt) || 0) +
    counts.CHD * (Number(fareChd) || 0) +
    counts.INF * (Number(fareInf) || 0)
  const previewRemaining = Math.max(0, previewTotal - (Number(amountReceived) || 0))

  async function saveQuote(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    setMsg(null)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pnrCode: pnrCode || undefined,
          fareAdt: Number(fareAdt) || 0,
          fareChd: Number(fareChd) || 0,
          fareInf: Number(fareInf) || 0,
          amountReceived: amountReceived === '' ? undefined : Number(amountReceived),
          expiryAt: expiryAt || undefined,
          adminNotes: adminNotes || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) setErr(json.error ?? 'Could not save quote')
      else {
        setMsg('Quote saved and the agent has been notified.')
        router.refresh()
      }
    } catch {
      setErr('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ===== Quote / PNR ===== */}
      <form onSubmit={saveQuote} className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">Quote &amp; PNR</h2>
        <p className="mb-4 text-xs text-slate-500">
          Set the per-passenger fares and (once reserved) the PNR + ticketing deadline. The total
          payable is assessed from these fares against the {passengers.length}-passenger manifest.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">ADT fare ({cur})</span>
            <input className={`${field} w-full`} type="number" min={0} value={fareAdt} onChange={(e) => setFareAdt(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Child fare ({cur})</span>
            <input className={`${field} w-full`} type="number" min={0} value={fareChd} onChange={(e) => setFareChd(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Infant fare ({cur})</span>
            <input className={`${field} w-full`} type="number" min={0} value={fareInf} onChange={(e) => setFareInf(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">PNR (after reservation)</span>
            <input className={`${field} w-full font-mono uppercase`} placeholder="e.g. ABC123" value={pnrCode} onChange={(e) => setPnrCode(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Ticketing deadline</span>
            <input className={`${field} w-full`} type="datetime-local" value={expiryAt} onChange={(e) => setExpiryAt(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">Amount received ({cur})</span>
            <input className={`${field} w-full`} type="number" min={0} value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-slate-500">Admin notes</span>
          <textarea className={`${field} w-full`} rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 p-3 text-sm">
          <span>Group total: <strong>{cur} {previewTotal.toLocaleString()}</strong></span>
          <span className="text-slate-400">|</span>
          <span>Received: <strong>{cur} {(Number(amountReceived) || 0).toLocaleString()}</strong></span>
          <span className="text-slate-400">|</span>
          <span className={previewRemaining > 0 ? 'text-red-600' : 'text-green-600'}>
            Remaining: <strong>{cur} {previewRemaining.toLocaleString()}</strong>
          </span>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        {msg && <p className="mt-3 rounded-lg bg-green-50 p-2 text-sm text-green-700">{msg}</p>}

        <button disabled={saving} className="btn-gold mt-4 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save quote & notify agent'}
        </button>
      </form>

      {/* ===== Passenger holds ===== */}
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-ink">Passengers &amp; issuance holds</h2>
        <p className="mb-4 text-xs text-slate-500">
          Hold ticket issuance for any passenger an agent asks you to wait on, with an optional
          release date and reason.
        </p>
        <div className="space-y-2">
          {passengers.map((p) => (
            <PassengerHoldRow key={p.id} passenger={p} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PassengerHoldRow({ passenger }: { passenger: PaxRow }) {
  const router = useRouter()
  const [hold, setHold] = useState(passenger.hold)
  const [holdUntil, setHoldUntil] = useState(passenger.hold_until ?? '')
  const [holdReason, setHoldReason] = useState(passenger.hold_reason ?? '')
  const [busy, setBusy] = useState(false)

  const field2 = 'rounded-md border border-slate-300 p-1.5 text-xs focus:border-gold focus:outline-none'

  async function save(nextHold: boolean) {
    setBusy(true)
    try {
      const res = await fetch(`/api/passengers/${passenger.id}/hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hold: nextHold,
          holdUntil: holdUntil || undefined,
          holdReason: holdReason || undefined,
        }),
      })
      if (res.ok) {
        setHold(nextHold)
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3">
      <div className="min-w-[160px] flex-1">
        <p className="text-sm font-semibold text-ink">
          {passenger.title ? `${passenger.title} ` : ''}{passenger.first_name} {passenger.last_name}
          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{passenger.pax_type}</span>
          {passenger.hold && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">ON HOLD</span>
          )}
        </p>
        <p className="text-xs text-slate-400">
          {passenger.passport_no ? `Passport ${passenger.passport_no}` : 'No passport on file'}
          {passenger.passport_expiry ? ` · exp ${passenger.passport_expiry}` : ''}
        </p>
      </div>
      <input className={field2} type="date" value={holdUntil} onChange={(e) => setHoldUntil(e.target.value)} title="Hold until" />
      <input className={`${field2} w-40`} placeholder="Reason" value={holdReason} onChange={(e) => setHoldReason(e.target.value)} />
      {hold ? (
        <button disabled={busy} onClick={() => save(false)} className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-40">
          Release hold
        </button>
      ) : (
        <button disabled={busy} onClick={() => save(true)} className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-40">
          Hold issuance
        </button>
      )}
    </div>
  )
}
