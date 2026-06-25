// =====================================================================
// Payment reconciliation — turns an inbound bank credit into ledger truth.
//
// 1. Map the virtual account number -> the owning agent.
// 2. Record the payment (idempotent on bank_ref).
// 3. Post a matching ledger entry (entry_type = 'payment').
// 4. Attach the credit to the agent's newest open request (reserved/submitted)
//    and roll up amount_received -> set payment_status unpaid|advance|full.
//
// Runs with the service-role client (bypasses RLS) because it is called from
// the bank webhook / cron poller, not an authenticated agent session.
// =====================================================================
import { supabaseAdmin } from '../supabase/admin'
import type { IncomingPayment } from '../integrations/bankApi'

export type ReconcileResult =
  | { ok: false; reason: string }
  | {
      ok: true
      duplicate?: boolean
      agentId: string
      requestId: string | null
      amountReceived: number
      fareTotal: number | null
      paymentStatus: 'unpaid' | 'advance' | 'full'
    }

export async function reconcilePayment(p: IncomingPayment): Promise<ReconcileResult> {
  // 0. Idempotency — ignore a credit we have already booked.
  const { data: existing } = await supabaseAdmin
    .from('payments')
    .select('id, agent_id, request_id, amount')
    .eq('bank_ref', p.bankRef)
    .maybeSingle()

  // 1. Resolve the agent from the virtual account number.
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id')
    .eq('virtual_account_no', p.virtualAccountNo)
    .maybeSingle()
  if (!agent) return { ok: false, reason: `No agent for virtual account ${p.virtualAccountNo}` }

  // 2. Find the agent's most relevant open request to attach the money to:
  //    prefer a reserved request awaiting full payment, else newest submitted.
  const { data: openReq } = await supabaseAdmin
    .from('requests')
    .select('id, fare_total, amount_received, booking_id')
    .eq('agent_id', agent.id)
    .in('status', ['reserved', 'under_review', 'submitted', 'approved', 'processing'])
    .order('reserved_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const requestId = openReq?.id ?? null

  // 3. Record the payment (skip insert if duplicate webhook).
  if (!existing) {
    const { error: payErr } = await supabaseAdmin.from('payments').insert({
      agent_id: agent.id,
      request_id: requestId,
      booking_id: openReq?.booking_id ?? null,
      amount: p.amount,
      currency: p.currency ?? 'PKR',
      kind: 'advance',
      status: 'reconciled',
      bank_ref: p.bankRef,
      virtual_account_no: p.virtualAccountNo,
      payer_name: p.payerName ?? null,
      raw: p.raw ?? null,
      received_at: p.receivedAt ?? new Date().toISOString(),
    })
    if (payErr) return { ok: false, reason: payErr.message }

    // 4. Mirror into the ledger for Metabase / agent statement.
    await supabaseAdmin.from('ledger').insert({
      agent_id: agent.id,
      booking_id: openReq?.booking_id ?? null,
      entry_type: 'payment',
      amount: p.amount,
      currency: p.currency ?? 'PKR',
      note: `Bank credit ${p.bankRef}${p.payerName ? ` from ${p.payerName}` : ''}`,
    })
  }

  // 5. Roll up totals on the attached request.
  let amountReceived = openReq?.amount_received ? Number(openReq.amount_received) : 0
  let fareTotal = openReq?.fare_total != null ? Number(openReq.fare_total) : null
  let paymentStatus: 'unpaid' | 'advance' | 'full' = 'unpaid'

  if (requestId) {
    // Authoritative recompute from all payments on this request.
    const { data: sums } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('request_id', requestId)
    amountReceived = (sums ?? []).reduce((t, r: any) => t + Number(r.amount), 0)
    if (fareTotal != null && fareTotal > 0) {
      paymentStatus = amountReceived >= fareTotal ? 'full' : amountReceived > 0 ? 'advance' : 'unpaid'
    } else {
      paymentStatus = amountReceived > 0 ? 'advance' : 'unpaid'
    }
    await supabaseAdmin
      .from('requests')
      .update({ amount_received: amountReceived, payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)
  }

  return {
    ok: true,
    duplicate: Boolean(existing),
    agentId: agent.id,
    requestId,
    amountReceived,
    fareTotal,
    paymentStatus,
  }
}
