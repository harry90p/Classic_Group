import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { supabaseAdmin } from '../../../../../lib/supabase/admin'
import {
  isSupabaseConfigured,
  isCompanyEmail,
  COMPANY_EMAIL_DOMAIN,
} from '../../../../../lib/supabase/env'
import { notifyAgent } from '../../../../../lib/notify'

// SUPER-ADMIN user management.
// Approve / reject / suspend agents, and grant or revoke limited ADMIN access
// (issuance / reservation / holds) to company-domain staff.
const ACTIONS = [
  'approve',
  'reject',
  'suspend',
  'reactivate',
  'make_admin',
  'revoke_admin',
] as const
type Action = (typeof ACTIONS)[number]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const action = body?.action as Action
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 })
  }

  // --- Caller must be a super-admin -------------------------------------
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('agents')
    .select('id, is_super_admin')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!caller || caller.is_super_admin !== true) {
    return NextResponse.json({ error: 'Super-admin only' }, { status: 403 })
  }

  // --- Load the target agent (service role bypasses RLS) ----------------
  const { data: target } = await supabaseAdmin
    .from('agents')
    .select('id, full_name, email, role, status, is_super_admin')
    .eq('id', id)
    .maybeSingle()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (target.id === caller.id) {
    return NextResponse.json(
      { error: 'You cannot change your own access here.' },
      { status: 400 },
    )
  }
  if (target.is_super_admin === true) {
    return NextResponse.json(
      { error: 'Another super-admin cannot be modified from this console.' },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {}
  let notify: { title: string; body: string } | null = null

  switch (action) {
    case 'approve':
      updates.status = 'active'
      updates.approved_at = now
      updates.approved_by = caller.id
      notify = {
        title: 'Your agent account is approved 🎉',
        body: 'Welcome aboard! Your Classic Group agent portal is now active. You can log in and start submitting group booking requests.',
      }
      break
    case 'reject':
      updates.status = 'rejected'
      break
    case 'suspend':
      updates.status = 'suspended'
      break
    case 'reactivate':
      updates.status = 'active'
      break
    case 'make_admin':
      if (!isCompanyEmail(target.email)) {
        return NextResponse.json(
          {
            error: `Admin access is limited to official @${COMPANY_EMAIL_DOMAIN} email addresses. This user registered with ${target.email}.`,
          },
          { status: 400 },
        )
      }
      updates.role = 'admin'
      updates.status = 'active'
      notify = {
        title: 'You have been granted admin access',
        body: 'A super-admin has granted you limited admin access to the Classic Group console (reservations, ticketing and holds). Log in to the admin console to get started.',
      }
      break
    case 'revoke_admin':
      updates.role = 'agent'
      break
  }

  const { error: upErr } = await supabaseAdmin
    .from('agents')
    .update(updates)
    .eq('id', id)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  if (notify) {
    try {
      await notifyAgent({ agentId: id, title: notify.title, body: notify.body })
    } catch {
      // notification is best-effort; the access change already succeeded
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
