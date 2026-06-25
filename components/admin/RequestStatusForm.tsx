'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const STATUSES = [
  'submitted',
  'under_review',
  'approved',
  'processing',
  'completed',
  'rejected',
  'cancelled',
]

export default function RequestStatusForm({
  id,
  currentStatus,
  currentNotes,
}: {
  id: string
  currentStatus: string
  currentNotes: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [adminNotes, setAdminNotes] = useState(currentNotes)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes }),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMsg({ ok: true, text: 'Saved. The agent will see the updated status.' })
      router.refresh()
    } else {
      setMsg({ ok: false, text: j.error || 'Could not save.' })
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <label className="block text-sm font-medium text-slate-600">Status
        <select className="field mt-1 capitalize" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-600">Admin notes (visible to the agent)
        <textarea className="field mt-1" rows={5} placeholder="e.g. Quoted PKR 450,000 — confirmed hotel & flights." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </label>
      <div className="flex items-center gap-4">
        <button disabled={busy} className="btn-gold disabled:opacity-60">{busy ? 'Saving…' : 'Save & process'}</button>
        {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
      </div>
    </form>
  )
}
