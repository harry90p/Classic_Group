import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { supabaseAdmin } from '../../../../lib/supabase/admin'
import { uploadTicketPdf } from '../../../../lib/storage/tickets'
import { isSupabaseConfigured } from '../../../../lib/supabase/env'
import { notifyAgent } from '../../../../lib/notify'

// ADMIN manual e-ticket upload (fallback when Amadeus auto-extraction is off).
// multipart/form-data: pnrId, file (PDF), optional ticketNumber, passengerName.
export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('agents')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!admin || admin.role !== 'admin')
    return NextResponse.json({ error: 'Admins only' }, { status: 403 })

  const form = await req.formData()
  const pnrId = form.get('pnrId') as string | null
  const file = form.get('file') as File | null
  const ticketNumber = (form.get('ticketNumber') as string | null) || `MANUAL-${Date.now()}`
  const passengerName = (form.get('passengerName') as string | null) || null
  if (!pnrId || !file)
    return NextResponse.json({ error: 'pnrId and file are required' }, { status: 400 })

  const { data: pnr } = await supabaseAdmin
    .from('pnrs')
    .select('id, pnr_code, agent_id, request_id')
    .eq('id', pnrId)
    .maybeSingle()
  if (!pnr) return NextResponse.json({ error: 'PNR not found' }, { status: 404 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const path = `${pnr.agent_id ?? 'unknown'}/${pnr.pnr_code}/${ticketNumber}.pdf`
  const up = await uploadTicketPdf(path, bytes)
  if (!up.ok) return NextResponse.json({ error: up.error }, { status: 500 })

  await supabaseAdmin.from('ticket_documents').upsert(
    {
      pnr_id: pnr.id,
      request_id: pnr.request_id,
      agent_id: pnr.agent_id,
      passenger_name: passengerName,
      ticket_number: ticketNumber,
      doc_path: path,
      source: 'manual',
    },
    { onConflict: 'ticket_number' },
  )
  await supabaseAdmin.from('pnrs').update({ ticket_number: ticketNumber }).eq('id', pnr.id)

  if (pnr.agent_id) {
    await notifyAgent({
      agentId: pnr.agent_id,
      title: `E-ticket ready — PNR ${pnr.pnr_code}`,
      body: `Your e-ticket for PNR ${pnr.pnr_code} is now available to download from your portal.`,
    })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
