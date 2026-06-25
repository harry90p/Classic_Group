'use client'
import { useState } from 'react'

type Announcement = { id: string; title: string; body?: string | null; level?: string }
type PaymentAlert = { pnrCode: string; airline?: string | null; expiryAt: string }

// Pops up on dashboard load with unread announcements + the agent's own
// payment-due PNRs. Dismissing marks the announcements read (server-side).
export default function AnnouncementModal({
  announcements,
  paymentAlerts,
}: {
  announcements: Announcement[]
  paymentAlerts: PaymentAlert[]
}) {
  const hasContent = announcements.length > 0 || paymentAlerts.length > 0
  const [open, setOpen] = useState(hasContent)
  if (!open) return null

  async function dismiss() {
    setOpen(false)
    if (announcements.length) {
      await fetch('/api/announcements/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: announcements.map((a) => a.id) }),
      }).catch(() => {})
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">📣 Welcome back</h2>

        {paymentAlerts.length > 0 && (
          <div className="mb-4 rounded border-l-4 border-red-500 bg-red-50 p-4">
            <div className="font-medium text-red-800">Payment reminders</div>
            <ul className="mt-2 space-y-1 text-sm text-red-700">
              {paymentAlerts.map((p) => (
                <li key={p.pnrCode}>
                  <span className="font-mono">{p.pnrCode}</span>
                  {p.airline ? ` (${p.airline})` : ''} — settle payment before{' '}
                  {new Date(p.expiryAt).toLocaleString()}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-red-600">
              You’ll also receive email + WhatsApp reminders before each deadline.
            </p>
          </div>
        )}

        {announcements.map((a) => (
          <div
            key={a.id}
            className={`mb-3 rounded border-l-4 bg-slate-50 p-4 ${
              a.level === 'payment'
                ? 'border-red-500'
                : a.level === 'warning'
                  ? 'border-amber-500'
                  : 'border-sky-500'
            }`}
          >
            <div className="font-medium">{a.title}</div>
            {a.body && <p className="mt-1 text-sm text-slate-600">{a.body}</p>}
          </div>
        ))}

        <button onClick={dismiss} className="mt-2 rounded bg-slate-900 px-5 py-2 text-white">
          Got it
        </button>
      </div>
    </div>
  )
}
