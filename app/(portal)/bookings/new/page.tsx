'use client'
import { useState } from 'react'

type Pax = {
  title: string
  firstName: string
  lastName: string
  paxType: string
  dob: string
  passportNo: string
  passportExpiry: string
}
const emptyPax: Pax = {
  title: 'Mr',
  firstName: '',
  lastName: '',
  paxType: 'ADT',
  dob: '',
  passportNo: '',
  passportExpiry: '',
}

const field = 'rounded-lg border border-slate-300 p-2 text-sm focus:border-gold focus:outline-none'

export default function NewBooking() {
  const [airline, setAirline] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [capacity, setCapacity] = useState('')
  const [pax, setPax] = useState<Pax[]>([{ ...emptyPax }])
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const updatePax = (i: number, patch: Partial<Pax>) =>
    setPax((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const removePax = (i: number) => setPax((prev) => prev.filter((_, idx) => idx !== i))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setSaving(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airline,
          origin,
          destination,
          travelDate,
          capacity: Number(capacity) || pax.length,
          data: pax,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setMsg('Group booking submitted. An admin will quote the fares and assign the PNR shortly.')
      } else {
        setErr(json.error ?? 'Could not submit booking')
      }
    } catch {
      setErr('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-ink">New group booking</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the group capacity and passenger manifest. Fares and the PNR are assigned by our
        admin team after you submit — you’ll be notified with the quote and payment details.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-3 font-semibold text-ink">Trip details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Airline" value={airline} onChange={(e) => setAirline(e.target.value)} />
            <input className={field} type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
            <input className={field} placeholder="Origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
            <input className={field} placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-500">Group capacity (total seats needed)</span>
              <input className={`${field} w-full`} type="number" min={1} placeholder="e.g. 40" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Passengers ({pax.length})</h2>
            <button type="button" className="text-sm font-semibold text-gold" onClick={() => setPax((p) => [...p, { ...emptyPax }])}>
              + Add passenger
            </button>
          </div>
          <div className="space-y-4">
            {pax.map((p, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Passenger {i + 1}</span>
                  {pax.length > 1 && (
                    <button type="button" className="text-xs text-red-500" onClick={() => removePax(i)}>Remove</button>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <select className={field} value={p.title} onChange={(e) => updatePax(i, { title: e.target.value })}>
                    <option>Mr</option>
                    <option>Mrs</option>
                    <option>Ms</option>
                    <option>Mstr</option>
                    <option>Miss</option>
                  </select>
                  <input className={field} placeholder="First name" value={p.firstName} onChange={(e) => updatePax(i, { firstName: e.target.value })} />
                  <input className={field} placeholder="Last name" value={p.lastName} onChange={(e) => updatePax(i, { lastName: e.target.value })} />
                  <select className={field} value={p.paxType} onChange={(e) => updatePax(i, { paxType: e.target.value })}>
                    <option value="ADT">Adult</option>
                    <option value="CHD">Child</option>
                    <option value="INF">Infant</option>
                  </select>
                  <label className="text-xs text-slate-500">
                    <span className="mb-1 block">Date of birth</span>
                    <input className={`${field} w-full`} type="date" value={p.dob} onChange={(e) => updatePax(i, { dob: e.target.value })} />
                  </label>
                  <div />
                  <input className={field} placeholder="Passport number" value={p.passportNo} onChange={(e) => updatePax(i, { passportNo: e.target.value })} />
                  <label className="text-xs text-slate-500 sm:col-span-2">
                    <span className="mb-1 block">Passport date of expiry</span>
                    <input className={`${field} w-full`} type="date" value={p.passportExpiry} onChange={(e) => updatePax(i, { passportExpiry: e.target.value })} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <button disabled={saving} className="btn-gold disabled:opacity-50">
          {saving ? 'Submitting…' : 'Submit group booking'}
        </button>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{msg}</p>}
      </form>
    </main>
  )
}
