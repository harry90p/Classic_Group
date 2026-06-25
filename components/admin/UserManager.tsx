'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type ManagedUser = {
  id: string
  full_name: string | null
  email: string | null
  whatsapp_number: string | null
  agent_code: string | null
  role: string
  status: string
  is_super_admin: boolean
  created_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  rejected: 'bg-slate-200 text-slate-600',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

export default function UserManager({
  pending,
  admins,
  agents,
  companyDomain,
}: {
  pending: ManagedUser[]
  admins: ManagedUser[]
  agents: ManagedUser[]
  companyDomain: string
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function act(id: string, action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? 'Action failed')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const isCompany = (email: string | null) =>
    !!email && email.trim().toLowerCase().endsWith('@' + companyDomain)

  const btn =
    'rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40'

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===== Pending approvals ===== */}
      <section className="rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Pending approvals</h2>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">No agents are waiting for approval.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {u.full_name || 'Unnamed'}
                    {isCompany(u.email) && (
                      <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                        Staff · eligible for admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                  {u.whatsapp_number && (
                    <p className="text-xs text-slate-400">WhatsApp: {u.whatsapp_number}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`${btn} bg-green-600 text-white hover:bg-green-700`}
                    disabled={busyId === u.id}
                    onClick={() => act(u.id, 'approve')}
                  >
                    Approve
                  </button>
                  {isCompany(u.email) && (
                    <button
                      className={`${btn} bg-ink text-white hover:bg-ink/90`}
                      disabled={busyId === u.id}
                      onClick={() => act(u.id, 'make_admin', `Grant limited admin access to ${u.full_name || u.email}?`)}
                    >
                      Make admin
                    </button>
                  )}
                  <button
                    className={`${btn} bg-slate-200 text-slate-700 hover:bg-slate-300`}
                    disabled={busyId === u.id}
                    onClick={() => act(u.id, 'reject', 'Reject this registration?')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Admin users ===== */}
      <section className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="mb-1 font-display text-lg font-bold text-ink">Admin users</h2>
        <p className="mb-3 text-xs text-slate-500">
          Staff with limited admin access (reservations, ticketing, holds). Admin access is
          restricted to official @{companyDomain} email addresses.
        </p>
        {admins.length === 0 ? (
          <p className="text-sm text-slate-400">No admin users yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {admins.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {u.full_name || 'Unnamed'}
                    {u.is_super_admin && (
                      <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold text-gold-dark">
                        SUPER ADMIN
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={u.status} />
                  {!u.is_super_admin && (
                    <button
                      className={`${btn} bg-slate-200 text-slate-700 hover:bg-slate-300`}
                      disabled={busyId === u.id}
                      onClick={() =>
                        act(u.id, 'revoke_admin', `Revoke admin access for ${u.full_name || u.email}? They will become a regular agent.`)
                      }
                    >
                      Revoke admin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Agent users ===== */}
      <section className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Agent users</h2>
        {agents.length === 0 ? (
          <p className="text-sm text-slate-400">No agents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Agent ID</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 pr-3 font-medium text-ink">{u.full_name || 'Unnamed'}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-500">{u.agent_code || '—'}</td>
                    <td className="py-2 pr-3 text-slate-500">{u.email}</td>
                    <td className="py-2 pr-3"><StatusBadge status={u.status} /></td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {u.status !== 'active' && (
                          <button
                            className={`${btn} bg-green-600 text-white hover:bg-green-700`}
                            disabled={busyId === u.id}
                            onClick={() => act(u.id, u.status === 'pending' ? 'approve' : 'reactivate')}
                          >
                            {u.status === 'pending' ? 'Approve' : 'Reactivate'}
                          </button>
                        )}
                        {u.status === 'active' && (
                          <button
                            className={`${btn} bg-red-100 text-red-700 hover:bg-red-200`}
                            disabled={busyId === u.id}
                            onClick={() => act(u.id, 'suspend', `Suspend ${u.full_name || u.email}? They will lose portal access.`)}
                          >
                            Suspend
                          </button>
                        )}
                        {isCompany(u.email) && (
                          <button
                            className={`${btn} bg-ink text-white hover:bg-ink/90`}
                            disabled={busyId === u.id}
                            onClick={() => act(u.id, 'make_admin', `Grant limited admin access to ${u.full_name || u.email}?`)}
                          >
                            Make admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
