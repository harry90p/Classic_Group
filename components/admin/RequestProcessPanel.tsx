'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Money = { fareTotal: number | null; amountReceived: number; paymentStatus: string; currency: string }

function fmtMoney(n: number | null | undefined, cur = 'PKR') {
  if (n === null || n === undefined) return '—'
  return `${cur} ${Number(n).toLocaleString()}`
}

export default function RequestProcessPanel({
  id,
  status,
  pnrCode,
  pnrId,
  expiryAt,
  money,
}: {
  id: string
  status: string
  pnrCode: string | null
  pnrId: string | null
  expiryAt: string | null
  money: Money
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Reserve form
  const [rPnr, setRPnr] = useState(pnrCode ?? '')
  const [rAirline, setRAirline] = useState('')
  const [rExpiry, setRExpiry] = useState('')
  const [rFare, setRFare] = useState(money.fareTotal ? String(money.fareTotal) : '')

  // Issue
  const [override, setOverride] = useState(false)
  const [ticketNo, setTicketNo] = useState('')

  // Manual ticket upload
  const [file, setFile] = useState<File | null>(null)

  const fullyPaid = money.paymentStatus === 'full'
  const isReserved = status === 'reserved'
  const isIssued = status === 'issued'

  async function reserve(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    const res = await fetch(`/api/requests/${id}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pnrCode: rPnr, airline: rAirline, expiryAt: rExpiry, fareTotal: rFare || undefined }),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMsg({ ok: true, text: 'Reserved. The agent now sees the reservation on their portal.' })
      router.refresh()
    } else setMsg({ ok: false, text: j.error || 'Could not reserve.' })
  }

  async function issue() {
    setBusy(true)
    setMsg(null)
    const res = await fetch(`/api/requests/${id}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ override, ticketNumber: ticketNo || undefined }),
    })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMsg({ ok: true, text: `Issued. ${j.ticketCount ? `${j.ticketCount} e-ticket(s) extracted.` : 'Upload the e-ticket below if not auto-extracted.'}` })
      router.refresh()
    } else setMsg({ ok: false, text: j.error || 'Could not issue.' })
  }

  async function uploadTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !pnrId) return
    setBusy(true)
    setMsg(null)
    const fd = new FormData()
    fd.append('pnrId', pnrId)
    fd.append('file', file)
    if (ticketNo) fd.append('ticketNumber', ticketNo)
    const res = await fetch('/api/tickets/upload', { method: 'POST', body: fd })
    const j = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setMsg({ ok: true, text: 'E-ticket uploaded and shared with the agent.' })
      router.refresh()
    } else setMsg({ ok: false, text: j.error || 'Upload failed.' })
  }

  const payTone =
    money.paymentStatus === 'full' ? 'bg-green-50 text-green-700'
    : money.paymentStatus === 'advance' ? 'bg-amber-50 text-amber-700'
    : 'bg-slate-100 text-slate-600'

  return (
    <div className="space-y-5">
      {/* Payment status (auto-monitored via bank API) */}
      <div className="rounded-xl border border-slate-100 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Payment</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${payTone}`}>{money.paymentStatus}</span>
        </div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Received</span><span className="font-medium">{fmtMoney(money.amountReceived, money.currency)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-slate-500">Fare total</span><span className="font-medium">{fmtMoney(money.fareTotal, money.currency)}</span></div>
        <p className="mt-2 text-xs text-slate-400">Auto-monitored from the bank feed via the agent&apos;s virtual account.</p>
      </div>

      {/* Stage 1: Reserve */}
      {!isIssued && (
        <form onSubmit={reserve} className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-ink">{isReserved ? 'Update reservation' : '1 · Reserve (add Amadeus PNR)'}</h3>
          <input className="field" placeholder="PNR code (from Amadeus)" value={rPnr} onChange={(e) => setRPnr(e.target.value.toUpperCase())} required />
          <input className="field" placeholder="Airline" value={rAirline} onChange={(e) => setRAirline(e.target.value)} />
          <label className="block text-xs font-medium text-slate-500">Ticketing time limit (TTL)
            <input className="field mt-1" type="datetime-local" value={rExpiry} onChange={(e) => setRExpiry(e.target.value)} required={!isReserved} />
          </label>
          <input className="field" type="number" placeholder="Fare total (PKR)" value={rFare} onChange={(e) => setRFare(e.target.value)} />
          <button disabled={busy} className="btn-gold w-full disabled:opacity-60">{busy ? 'Saving…' : isReserved ? 'Update reservation' : 'Approve as Reserved'}</button>
        </form>
      )}

      {/* Stage 2: Issue */}
      {isReserved && (
        <div className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-ink">2 · Issue ticket</h3>
          {!fullyPaid && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Full payment not yet received. Issuing is blocked unless you override.</p>
          )}
          <input className="field" placeholder="Ticket number (optional)" value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} />
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
            Override payment check (settled off-system)
          </label>
          <button disabled={busy || (!fullyPaid && !override)} className="btn-gold w-full disabled:opacity-60">{busy ? 'Issuing…' : 'Mark as Issued'}</button>
        </div>
      )}

      {/* Stage 3: Manual e-ticket upload (fallback) */}
      {isIssued && pnrId && (
        <form onSubmit={uploadTicket} className="space-y-3 rounded-xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-ink">E-ticket document</h3>
          <p className="text-xs text-slate-400">If Amadeus auto-extraction isn&apos;t live, upload the issued e-ticket PDF here to share it with the agent.</p>
          <input className="field" placeholder="Ticket number (optional)" value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} />
          <input className="field" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button disabled={busy || !file} className="btn-gold w-full disabled:opacity-60">{busy ? 'Uploading…' : 'Upload &amp; share e-ticket'}</button>
        </form>
      )}

      {msg && <p className={`text-sm ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  )
}
