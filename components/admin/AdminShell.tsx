'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import LogoutButton from '../portal/LogoutButton'

type Item = { href: string; label: string }
type Group = { heading?: string; items: Item[]; super?: boolean }

// Admin navigation — a management console, deliberately distinct from the
// agent portal (dark theme + ops-focused sections).
const groups: Group[] = [
  { items: [{ href: '/admin', label: '📊  Dashboard' }] },
  {
    heading: 'Operations',
    items: [
      { href: '/admin/requests', label: '📦  Package Requests' },
      { href: '/admin/bookings', label: '🧭  Group Bookings' },
      { href: '/admin/pnrs', label: '📅  PNR & Ticketing' },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { href: '/admin/payments', label: '💰  Payments' },
    ],
  },
  {
    heading: 'People',
    items: [
      { href: '/admin/agents', label: '👥  Agents' },
    ],
  },
  // 'super' marks sections only the platform owner (super-admin) may see.
  {
    heading: 'Administration',
    super: true,
    items: [{ href: '/admin/users', label: '🛡️  User Management' }],
  },
  {
    heading: 'Communications',
    items: [{ href: '/admin/announcements', label: '📣  News & Announcements' }],
  },
  {
    heading: 'Switch',
    items: [{ href: '/dashboard', label: '←  Agent Portal' }],
  },
]

export default function AdminShell({
  email,
  adminName,
  pendingCount = 0,
  isSuperAdmin = false,
  children,
}: {
  email: string
  adminName: string
  pendingCount?: number
  isSuperAdmin?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Limited company admins don't see super-admin-only sections.
  const visibleGroups = groups.filter((g) => !g.super || isSuperAdmin)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar — dark control-panel theme (distinct from the gold agent portal) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-ink text-white shadow-2xl transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 flex-col items-center justify-center gap-0.5 border-b border-white/10 px-5">
          <img src="/assets/img/logos/logo-footer.png" alt="Classic Group of Travels" className="h-8 w-auto" />
          <span className="text-[9px] font-bold tracking-[0.35em] text-gold-light">{isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN CONSOLE'}</span>
        </div>
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 text-sm">
          {visibleGroups.map((g, i) => (
            <div key={i} className="mb-5">
              {g.heading && (
                <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  {g.heading}
                </div>
              )}
              {g.items.map((it) => {
                const active = pathname === it.href
                const showBadge = it.href === '/admin/requests' && pendingCount > 0
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={`mb-0.5 flex items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
                      active
                        ? 'bg-gold text-white shadow'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{it.label}</span>
                    {showBadge && (
                      <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-white">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
          <div className="mb-2 px-2 pt-2">
            <LogoutButton className="block w-full rounded-lg px-3 py-2 text-left font-medium text-white/70 transition hover:bg-white/10 hover:text-white" />
          </div>
        </nav>
      </aside>

      {/* Overlay (mobile) */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Dark accent header so the admin area never reads as the agent portal */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gold/30 bg-ink px-4 text-white sm:px-6">
          <button className="text-2xl lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <Link href="/admin" className="hidden items-center gap-2 lg:flex">
            <img src="/assets/img/logos/logo-footer.png" alt="Classic Group of Travels" className="h-8 w-auto" />
            <span className="rounded bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Admin Console</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-white/90 sm:inline">{adminName || email}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-sm font-bold text-white">
              {(adminName || email || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] bg-slate-100">{children}</main>
        <footer className="bg-ink px-6 py-4 text-center text-xs text-white/40">
          2026 © Classic Group of Travels — Admin Console
        </footer>
      </div>
    </div>
  )
}
