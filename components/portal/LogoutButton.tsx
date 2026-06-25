'use client'
import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function LogoutButton({ className = '' }: { className?: string }) {
  async function logout() {
    if (URL && KEY) {
      const supabase = createBrowserClient(URL, KEY)
      await supabase.auth.signOut()
    }
    window.location.href = '/login'
  }
  return (
    <button onClick={logout} className={className}>
      ➜ Logout
    </button>
  )
}
