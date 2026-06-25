'use client'
import { useState } from 'react'

// Admin-only in practice (the API enforces role = 'admin').
export default function NewAnnouncement() {
  const [form, setForm] = useState({
    title: '',
    body: '',
    level: 'info',
    audience: 'all',
    endsAt: '',
  })
  const [msg, setMsg] = useState<string | null>(null)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const j = await res.json()
    setMsg(res.ok ? 'Published — agents will see it on their dashboard.' : `Error: ${j.error}`)
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Post announcement</h1>
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full rounded border p-2" placeholder="Title"
          value={form.title} onChange={(e) => set('title', e.target.value)} />
        <textarea className="w-full rounded border p-2" placeholder="Message" rows={4}
          value={form.body} onChange={(e) => set('body', e.target.value)} />
        <label className="block text-sm text-slate-600">Level
          <select className="mt-1 w-full rounded border p-2" value={form.level}
            onChange={(e) => set('level', e.target.value)}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="payment">Payment</option>
          </select>
        </label>
        <label className="block text-sm text-slate-600">Audience
          <input className="mt-1 w-full rounded border p-2" placeholder="all | role:agent | agent:<uuid>"
            value={form.audience} onChange={(e) => set('audience', e.target.value)} />
        </label>
        <label className="block text-sm text-slate-600">Expires (optional)
          <input className="mt-1 w-full rounded border p-2" type="datetime-local"
            value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
        </label>
        <button className="rounded bg-slate-900 px-5 py-2 text-white">Publish</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  )
}
