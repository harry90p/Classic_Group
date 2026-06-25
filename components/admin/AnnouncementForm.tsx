'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const empty = { title: '', body: '', level: 'info', audience: 'all', endsAt: '' }

export default function AnnouncementForm() {
  const router = useRouter()
  const [form, setForm] = useState({ ...empty })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMsg({ ok: true, text: 'Published — agents will see it on their dashboard at next login.' })
      setForm({ ...empty })
      router.refresh()
    } else {
      setMsg({ ok: false, text: j.error || 'Could not publish.' })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input className="field" placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
      <textarea className="field" placeholder="Message / newsletter body" rows={4} value={form.body} onChange={(e) => set('body', e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">Level
          <select className="field mt-1" value={form.level} onChange={(e) => set('level', e.target.value)}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="payment">Payment</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-600">Audience
          <select className="field mt-1" value={form.audience} onChange={(e) => set('audience', e.target.value)}>
            <option value="all">All agents</option>
            <option value="role:agent">Agents only</option>
            <option value="role:sub_agent">Sub-agents only</option>
            <option value="role:admin">Admins only</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-600">Expires (optional)
        <input className="field mt-1" type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} />
      </label>
      <div className="flex items-center gap-4">
        <button disabled={busy} className="btn-gold disabled:opacity-60">{busy ? 'Publishing…' : 'Publish news'}</button>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
      </div>
    </form>
  )
}
