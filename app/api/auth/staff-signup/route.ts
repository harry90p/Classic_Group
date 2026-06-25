import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/admin'
import { isSupabaseConfigured, isCompanyEmail } from '../../../../lib/supabase/env'

// Best-effort: when a company-domain email registers, notify every super-admin
// so they can grant limited admin access from Admin -> Users. Called right after
// sign-up from the registration page. Safe to call for any email — non-company
// addresses (regular agents) are simply ignored, and it never blocks signup.
export async function POST(req: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ ok: true })

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const email = (body?.email ?? '').trim().toLowerCase()
  if (!email || !isCompanyEmail(email)) return NextResponse.json({ ok: true })

  try {
    // Confirm a freshly-registered, still-pending account exists for this email
    // (the signup trigger creates it). Only notify for genuine new staff.
    const { data: target } = await supabaseAdmin
      .from('agents')
      .select('full_name, email, status, role')
      .ilike('email', email)
      .maybeSingle()
    if (!target || target.role === 'admin' || target.status !== 'pending') {
      return NextResponse.json({ ok: true })
    }

    const { data: supers } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('is_super_admin', true)
    if (!supers || supers.length === 0) return NextResponse.json({ ok: true })

    const who = target.full_name
      ? `${target.full_name} (${target.email})`
      : target.email
    const title = 'New staff signup — admin access pending'
    const text = `${who} registered with a company email address. Review them in Admin -> Users to grant limited admin access.`

    const rows = supers.map((s) => ({ agent_id: s.id, title, body: text }))
    await supabaseAdmin.from('notifications').insert(rows)
  } catch {
    // best-effort only — never surface to the registrant
  }

  return NextResponse.json({ ok: true })
}
