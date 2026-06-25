'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const TYPES = [
  { v: 'custom_package', l: '📦  Custom Package' },
  { v: 'visa', l: '🛂  Visa' },
  { v: 'ticket', l: '🎫  Air Ticket' },
  { v: 'hotel', l: '🏨  Hotel' },
  { v: 'transport', l: '🚌  Transport' },
  { v: 'insurance', l: '🛡️  Travel Insurance' },
  { v: 'ziyarat', l: '🕌  Ziyarat' },
  { v: 'tour', l: '🌍  Tour' },
  { v: 'other', l: '✨  Other' },
]

const empty = {
  requestType: 'custom_package',
  title: '',
  destination: '',
  clientName: '',
  clientPhone: '',
  paxCount: '1',
  departureDate: '',
  returnDate: '',
  nights: '',
  hotel: '',
  transport: '',
  inclusions: '',
  budget: '',
  currency: 'PKR',
  notes: '',
}

export default function CreatePackage() {
  const router = useRouter()
  const [form, setForm] = useState({ ...empty })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMsg({ ok: true, text: 'Submitted! Our team will review and process your request.' })
      setForm({ ...empty })
      setTimeout(() => router.push('/packages'), 1200)
    } else {
      setMsg({ ok: false, text: j.error || 'Something went wrong.' })
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Custom Package Creator</h1>
          <p className="text-sm text-slate-500">
            Build a tailored package for your client. It will be sent to our team for processing.
          </p>
        </div>
        <Link href="/packages" className="text-sm font-semibold text-gold">← My Packages</Link>
      </div>

      <form onSubmit={submit} className="max-w-3xl space-y-6">
        {/* Package basics */}
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Package details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">Type
              <select className="field mt-1" value={form.requestType} onChange={(e) => set('requestType', e.target.value)}>
                {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">Title / Package name
              <input className="field mt-1" placeholder="e.g. 10-Day Premium Umrah" value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </label>
            <label className="text-sm font-medium text-slate-600">Destination
              <input className="field mt-1" placeholder="e.g. Makkah & Madinah" value={form.destination} onChange={(e) => set('destination', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Travellers (PAX)
              <input className="field mt-1" type="number" min={1} value={form.paxCount} onChange={(e) => set('paxCount', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Departure date
              <input className="field mt-1" type="date" value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Return date
              <input className="field mt-1" type="date" value={form.returnDate} onChange={(e) => set('returnDate', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Nights
              <input className="field mt-1" type="number" min={0} placeholder="e.g. 9" value={form.nights} onChange={(e) => set('nights', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Hotel preference
              <input className="field mt-1" placeholder="e.g. 5★ near Haram" value={form.hotel} onChange={(e) => set('hotel', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Transport
              <input className="field mt-1" placeholder="e.g. Private coach" value={form.transport} onChange={(e) => set('transport', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Budget
              <div className="mt-1 flex gap-2">
                <select className="field w-24" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option>PKR</option><option>USD</option><option>SAR</option><option>AED</option>
                </select>
                <input className="field flex-1" type="number" min={0} placeholder="Amount" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
              </div>
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-600">Inclusions
            <textarea className="field mt-1" rows={2} placeholder="e.g. Flights, visa, hotel, transport, meals, ziyarat" value={form.inclusions} onChange={(e) => set('inclusions', e.target.value)} />
          </label>
        </section>

        {/* Client */}
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Client</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">Client name
              <input className="field mt-1" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-600">Client phone
              <input className="field mt-1" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-600">Notes / special requests
            <textarea className="field mt-1" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </label>
        </section>

        <div className="flex items-center gap-4">
          <button disabled={busy} className="btn-gold disabled:opacity-60">{busy ? 'Submitting…' : 'Submit to admin'}</button>
          {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
        </div>
      </form>
    </div>
  )
}
