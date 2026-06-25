'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function ChangePasswordPage() {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (pw !== confirm) { setErr('Passwords do not match.'); return }
    if (!URL || !KEY) { setErr('Supabase not configured.'); return }
    const supabase = createBrowserClient(URL, KEY)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) setErr(error.message)
    else { setMsg('Password updated successfully.'); setPw(''); setConfirm('') }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Change Password</h1>
      <form onSubmit={onSubmit} className="mt-4 max-w-md rounded-2xl bg-white p-6 shadow-card">
        <label className="block text-xs font-semibold text-slate-500">New Password</label>
        <input type="password" className="field mt-1" value={pw} onChange={(e) => setPw(e.target.value)} />
        <label className="mt-4 block text-xs font-semibold text-slate-500">Confirm Password</label>
        <input type="password" className="field mt-1" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        {msg && <p className="mt-3 rounded-lg bg-green-50 p-2 text-sm text-green-700">{msg}</p>}
        <button className="btn-gold mt-5">Update Password</button>
      </form>
    </div>
  )
}
