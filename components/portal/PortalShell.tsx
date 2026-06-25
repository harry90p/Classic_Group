'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import LogoutButton from './LogoutButton'

type Item = { href: string; label: string }
type Group = { heading?: string; items: Item[] }

const groups: Group[] = [
  { items: [{ href: '/dashboard', label: '🏠  Dashboard' }] },
  {
    heading: 'Groups',
    items: [
      { href: '/groups', label: '🛩️  Group Flights' },
      { href: '/pnrs', label: '📅  PNR Deadlines' },
      { href: '/bookings/new', label: '➕  New Booking' },
    ],
  },
  {
    heading: 'Packages',
    items: [
      { href: '/packages', label: '📦  My Packages' },
      { href: '/packages/new', label: '➕  Create Package' },
    ],
  },
  {
    heading: 'Accounts',
    items: [
      { href: '/payments/add', label: '💳  Add Payment' },
      { href: '/payments', label: '🧾  View Payments' },
      { href: '/ledger', label: '📒  Ledger' },
    ],
  },
  { heading: 'Banks', items: [{ href: '/banks', label: '🏦  Bank Accounts' }] },
  {
    heading: 'Settings',
    items: [
      { href: '/profile', label: '👤  Profile' },
      { href: '/change-password', label: '🔑  Change Password' },
    ],
  },
]

export default function PortalShell({
  email,
  agentName,
  isAdmin = false,
  children,
}: {
  email: string
  agentName: string
  isAdmin?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-gold text-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-center border-b border-white/20 px-5">
          <img src="/assets/img/logos/logo-footer.png" alt="Classic Group of Travels" className="h-10 w-auto" />
        </div>
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 text-sm">
          {isAdmin && (
            <div className="mb-4">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-lg border border-white/40 bg-white/10 px-3 py-2 font-semibold text-white transition hover:bg-white/20"
              >
                🛡️  Admin Panel
              </Link>
            </div>
          )}
          {groups.map((g, i) => (
            <div key={i} className="mb-4">
              {g.heading && (
                <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  {g.heading}
                </div>
              )}
              {g.items.map((it) => {
                const active = pathname === it.href
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 font-medium transition ${
                      active ? 'bg-white/25 text-white' : 'text-white/90 hover:bg-white/15'
                    }`}
                  >
                    {it.label}
                  </Link>
                )
              })}
            </div>
          ))}
          <div className="mb-2 px-2 pt-2">
            <LogoutButton className="block w-full rounded-lg px-3 py-2 text-left font-medium text-white/90 transition hover:bg-white/15" />
          </div>
        </nav>
      </aside>

      {/* Overlay (mobile) */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
          <button className="text-2xl lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <Link href="/" className="hidden lg:block">
            <img src="/assets/img/logos/logo-navbar.png" alt="Classic Group of Travels" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-gold px-3 py-1 text-xs font-bold text-white">PKR: 0</span>
            <span className="text-sm font-medium">{agentName || email}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-sm font-bold text-gold">
              {(agentName || email || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main>{children}</main>
        <footer className="px-6 py-4 text-center text-xs text-slate-400">
          2026 © Classic Group of Travels
        </footer>
      </div>
    </div>
  )
}
