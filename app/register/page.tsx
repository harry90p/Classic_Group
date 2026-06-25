'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const configured = Boolean(URL && KEY)

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', firstName: '', lastName: '', agency: '',
    phone: '', whatsapp: '', city: '', province: '', country: '', address: '', password: '',
  })
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!configured) {
      setErr('Supabase is not configured yet — add keys to .env.local to enable real registration.')
      return
    }
    const supabase = createBrowserClient(URL!, KEY!)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: `${form.firstName} ${form.lastName}`.trim(),
          agency_name: form.agency,
          phone: form.phone,
          whatsapp: form.whatsapp,
        },
      },
    })
    if (error) {
      setErr(error.message)
    } else {
      setMsg('Account request submitted! Please check your email to confirm, then await admin approval.')
      // Best-effort: alert super-admins if this is a company staff email so they
      // can grant limited admin access from Admin -> Users. Never blocks signup.
      try {
        await fetch('/api/auth/staff-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        })
      } catch {
        // ignore — purely a convenience notification
      }
    }
  }

  return (
    <>
      <SiteHeader />
      <section className="bg-slate-50 py-16">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <span className="script-accent">Join Our Portal</span>
            <h1 className="font-display text-3xl font-bold">Create Your Account</h1>
            <p className="mt-3 text-slate-600">
              Create your account to access exclusive Umrah, KSA, Oman, UK and UAE group deals and partner travel
              benefits.
            </p>
            <ul className="mt-6 space-y-4">
              {[
                ['Exclusive Rates', 'Special partner prices for all destinations.'],
                ['Fast Booking', 'Quick and efficient reservation process.'],
                ['24/7 Support', 'We’re always here to help your agency.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">✓</span>
                  <div><div className="font-semibold">{t}</div><p className="text-sm text-slate-600">{d}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={onSubmit} className="rounded-2xl bg-white p-8 shadow-card lg:col-span-2">
            <p className="mb-4 text-sm text-slate-500">Fields marked are required.</p>
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              New accounts are reviewed by an administrator before activation. Classic Group staff: register with your official company email to be granted admin access.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="field" placeholder="User Name" value={form.username} onChange={set('username')} />
              <input className="field" placeholder="Email" value={form.email} onChange={set('email')} />
              <input className="field" placeholder="First Name" value={form.firstName} onChange={set('firstName')} />
              <input className="field" placeholder="Last Name" value={form.lastName} onChange={set('lastName')} />
              <input className="field sm:col-span-2" placeholder="Agency Name" value={form.agency} onChange={set('agency')} />
              <input className="field" placeholder="Phone" value={form.phone} onChange={set('phone')} />
              <input className="field" placeholder="WhatsApp" value={form.whatsapp} onChange={set('whatsapp')} />
              <input className="field" placeholder="City" value={form.city} onChange={set('city')} />
              <input className="field" placeholder="Province" value={form.province} onChange={set('province')} />
              <input className="field" placeholder="Country" value={form.country} onChange={set('country')} />
              <input className="field" placeholder="Password" type="password" value={form.password} onChange={set('password')} />
              <input className="field sm:col-span-2" placeholder="Address" value={form.address} onChange={set('address')} />
            </div>
            {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
            {msg && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{msg}</p>}
            <button className="btn-gold mt-6">Register Now</button>
            <p className="mt-3 text-sm text-slate-500">
              Already a member? <Link href="/login" className="font-semibold text-gold">Login to your account</Link>
            </p>
          </form>
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
