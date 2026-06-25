'use client'
import Link from 'next/link'
import { useState } from 'react'

const nav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact Us' },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="hidden bg-ink text-white md:block">
        <div className="container-x flex items-center justify-between py-2 text-xs">
          <span>📍 Office No. 1, 1st Floor, Rajpoot Plaza, Fazal-e-Haq Road, Blue Area, Islamabad</span>
          <span className="flex items-center gap-5">
            <a href="tel:+923000773940" className="hover:text-gold-light">📞 0300 0773940</a>
            <a href="mailto:info@classicgroupoftravels.com" className="hover:text-gold-light">✉️ info@classicgroupoftravels.com</a>
          </span>
        </div>
      </div>
      {/* Main bar */}
      <div className="bg-white shadow-sm">
        <div className="container-x flex items-center justify-between py-3">
          <Link href="/" className="flex items-center">
            <img
              src="/assets/img/logos/logo-navbar.png"
              alt="Classic Group of Travels"
              className="h-20 w-auto md:h-26"
            />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="transition hover:text-gold">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/register" className="btn-outline">Agent Registration</Link>
            <Link href="/login" className="btn-gold">Agent Login →</Link>
          </div>
          <button className="text-2xl lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            ☰
          </button>
        </div>
        {open && (
          <div className="border-t lg:hidden">
            <div className="container-x flex flex-col gap-1 py-3 text-sm">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-1.5">
                  {n.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3">
                <Link href="/register" className="btn-outline">Register</Link>
                <Link href="/login" className="btn-gold">Login</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
