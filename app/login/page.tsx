'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const configured = Boolean(URL && KEY)
const IMG = '/assets/img'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Detect the admin subdomain on the client so the same login page can brand
  // itself as “Admin Login” on admin.<domain> and “Agent Login” everywhere else.
  const [isAdminHost, setIsAdminHost] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdminHost(window.location.hostname.startsWith('admin.'))
    }
  }, [])

  const heading = isAdminHost ? 'Admin Login' : 'Agent Login'
  const tagline = isAdminHost
    ? 'Staff console for reservations, ticketing, holds and approvals.'
    : 'Agent portal for group flights, PNR deadlines, payments and Umrah packages.'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!configured) {
      setError('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.')
      return
    }
    setLoading(true)
    const supabase = createBrowserClient(URL!, KEY!)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    // Let the server decide where to go based on the user's role. Staying on the
    // same host keeps the just-issued session cookie valid (no cross-host hops).
    window.location.href = '/post-login'
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:block">
        <img src={`${IMG}/madinah.webp`} alt="" className="h-full w-full object-cover" />
        <div className={`absolute inset-0 ${isAdminHost ? 'bg-ink/80' : 'bg-ink/70'}`} />
        <div className="absolute inset-0 flex flex-col justify-center p-12 text-white">
          <span className="script-accent text-3xl text-gold-light">
            {isAdminHost ? 'Control Center' : 'Welcome Back'}
          </span>
          <h2 className="mt-2 font-display text-4xl font-extrabold">Classic Group of Travels</h2>
          <p className="mt-3 max-w-sm text-white/80">{tagline}</p>
        </div>
      </div>
      {/* Form panel */}
      <div className={`flex items-center justify-center p-6 ${isAdminHost ? 'bg-ink' : 'bg-slate-50'}`}>
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-100 bg-white p-8 shadow-card">
          <Link href="/" className="flex items-center">
            <img src="/assets/img/logos/logo-navbar.png" alt="Classic Group of Travels" className="h-10 w-auto" />
          </Link>
          {isAdminHost && (
            <span className="inline-block rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-light">
              Staff &amp; Admin
            </span>
          )}
          <h1 className="font-display text-2xl font-bold">{heading}</h1>
          {!configured && (
            <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              Demo mode: connect Supabase in .env.local to enable real login.
            </p>
          )}
          <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="btn-gold w-full disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          {isAdminHost ? (
            <p className="text-center text-xs text-slate-400">
              Authorized Classic Group staff only.
            </p>
          ) : (
            <p className="text-center text-sm text-slate-500">
              New partner? <Link href="/register" className="font-semibold text-gold">Register now</Link>
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
