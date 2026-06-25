import { NextResponse } from 'next/server'
import {
  parseIncomingPayment,
  verifyWebhookSignature,
} from '../../../../lib/integrations/bankApi'
import { reconcilePayment } from '../../../../lib/payments/reconcile'
import { isSupabaseConfigured } from '../../../../lib/supabase/env'

// BANK -> us. The bank POSTs each credit that lands on a virtual account.
// We verify the signature, map the virtual account -> agent, and reconcile
// (record payment + ledger entry + roll up the request's payment_status).
//
// Accepts a single record or { records: [...] }. Idempotent on bank_ref.
export async function POST(req: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 })
  }

  const raw = await req.text()
  const signature =
    req.headers.get('x-bank-signature') ||
    req.headers.get('x-signature') ||
    req.headers.get('x-webhook-signature')

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const records: Record<string, unknown>[] = Array.isArray(payload?.records)
    ? payload.records
    : Array.isArray(payload)
      ? payload
      : [payload]

  const results: unknown[] = []
  for (const rec of records) {
    const incoming = parseIncomingPayment(rec)
    if (!incoming) {
      results.push({ ok: false, reason: 'Unrecognized payment record' })
      continue
    }
    const r = await reconcilePayment(incoming)
    results.push({ bankRef: incoming.bankRef, ...r })
  }

  return NextResponse.json({ ok: true, processed: results.length, results }, { status: 200 })
}
