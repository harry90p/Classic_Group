'use client'
import { useState } from 'react'

export default function NewPnr() {
  const [form, setForm] = useState({
    pnrCode: '',
    airline: '',
    bookingAt: '',
    issuanceAt: '',
    expiryAt: '',
  })
  const [msg, setMsg] = useState<string | null>(null)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const res = await fetch('/api/pnrs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setMsg(res.ok ? 'PNR saved. Reminders will fire T-48h / T-24h before the deadline.' : `Error: ${json.error}`)
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Add PNR (manual)</h1>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full rounded border p-2" placeholder="PNR code (e.g. ABC123)"
          value={form.pnrCode} onChange={(e) => set('pnrCode', e.target.value.toUpperCase())} />
        <input className="w-full rounded border p-2" placeholder="Airline"
          value={form.airline} onChange={(e) => set('airline', e.target.value)} />
        <label className="block text-sm text-slate-600">Booking date
          <input className="mt-1 w-full rounded border p-2" type="datetime-local"
            value={form.bookingAt} onChange={(e) => set('bookingAt', e.target.value)} />
        </label>
        <label className="block text-sm text-slate-600">Issuance date
          <input className="mt-1 w-full rounded border p-2" type="datetime-local"
            value={form.issuanceAt} onChange={(e) => set('issuanceAt', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-800">Deadline / expiry (TTL) — required
          <input className="mt-1 w-full rounded border p-2" type="datetime-local" required
            value={form.expiryAt} onChange={(e) => set('expiryAt', e.target.value)} />
        </label>
        <button className="rounded bg-slate-900 px-5 py-2 text-white">Save PNR</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  )
}
