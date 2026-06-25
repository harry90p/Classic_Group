'use client'
import { useState } from 'react'

// Fetches a short-lived signed URL for the agent's e-ticket, then opens it.
export default function TicketDownload({ ticketId }: { ticketId: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function download() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`)
      const j = await res.json().catch(() => ({}))
      if (res.ok && j.url) {
        window.open(j.url, '_blank', 'noopener')
      } else {
        setErr(j.error || 'Could not fetch ticket')
      }
    } catch {
      setErr('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button onClick={download} disabled={busy} className="text-sm font-semibold text-gold disabled:opacity-50">
      {busy ? 'Preparing…' : err ? 'Retry' : 'Download'}
    </button>
  )
}
