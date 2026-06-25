// =====================================================================
// Bank API adapter — per-agent virtual accounts + payment ingestion.
//
// HOW IT MAPS MONEY TO AN AGENT
// We assign every agent a unique virtual account number whose digits embed
// the agent serial (agents.virtual_account_no, e.g. 0000000042). The full
// collection IBAN is built from BANK_IBAN_PREFIX + that virtual account, so a
// transfer that lands on it can be traced straight back to one agent.
//
// Most Pakistani banks / aggregators (e.g. virtual-account or RAAST settlement
// products) deliver credits one of two ways:
//   1. WEBHOOK  — the bank POSTs each credit to /api/payments/webhook.
//   2. POLL     — we pull a statement/credits feed on a schedule.
// Both funnel into parseIncomingPayment() -> the same reconcile() routine.
//
// This module is a guarded adapter (mirrors lib/pnr/sources/amadeus.ts): it is
// only "live" when BANK_API_* env vars are present. Until then the webhook still
// works for manual/test posts, but signature verification is skipped.
// Fill in verifySignature() + the poll() request once you share the bank's spec.
// =====================================================================
import crypto from 'crypto'

const BASE = process.env.BANK_API_BASE
const KEY = process.env.BANK_API_KEY
const WEBHOOK_SECRET = process.env.BANK_WEBHOOK_SECRET
const IBAN_PREFIX = process.env.BANK_IBAN_PREFIX // e.g. "PK00CLAS0000" (your collection IBAN stem)

export const bankApiEnabled = Boolean(BASE && KEY)

// Build the customer-facing IBAN an agent should receive funds on.
export function ibanForAgent(virtualAccountNo: string): string | null {
  if (!IBAN_PREFIX) return null
  return `${IBAN_PREFIX}${virtualAccountNo}`
}

// Normalized shape every inbound credit is mapped into before reconcile().
export type IncomingPayment = {
  bankRef: string // unique bank transaction id (idempotency key)
  virtualAccountNo: string // which virtual account the money landed in
  amount: number
  currency?: string
  payerName?: string
  receivedAt?: string // ISO
  raw?: unknown
}

// Verify a webhook came from the bank. HMAC-SHA256 over the raw body is the
// common default; swap to the scheme in your bank's docs if different.
export function verifyWebhookSignature(rawBody: string, signature?: string | null): boolean {
  if (!WEBHOOK_SECRET) return true // no secret configured yet -> allow (test mode)
  if (!signature) return false
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex')
  // constant-time compare
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

// Map a raw bank webhook/poll record into IncomingPayment.
// Adjust the field names to match your bank's payload once known.
export function parseIncomingPayment(rec: Record<string, unknown>): IncomingPayment | null {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = rec[k]
      if (v !== undefined && v !== null && v !== '') return v
    }
    return undefined
  }
  const bankRef = get('bankRef', 'transactionId', 'txnId', 'reference', 'id')
  const virtualAccountNo = get('virtualAccountNo', 'virtualAccount', 'accountNumber', 'creditAccount', 'iban')
  const amount = get('amount', 'creditAmount', 'value')
  if (!bankRef || !virtualAccountNo || amount === undefined) return null

  // If the bank reports the full IBAN, slice the trailing virtual-account digits.
  let vacct = String(virtualAccountNo)
  if (IBAN_PREFIX && vacct.startsWith(IBAN_PREFIX)) vacct = vacct.slice(IBAN_PREFIX.length)

  return {
    bankRef: String(bankRef),
    virtualAccountNo: vacct,
    amount: Number(amount),
    currency: (get('currency') as string) || 'PKR',
    payerName: get('payerName', 'senderName', 'remitterName') as string | undefined,
    receivedAt: (get('receivedAt', 'valueDate', 'timestamp') as string) || new Date().toISOString(),
    raw: rec,
  }
}

// Pull recent credits from the bank (used by the cron poller when there is no
// webhook). Returns [] until BANK_API_* is configured.
export async function pollBankCredits(sinceISO?: string): Promise<IncomingPayment[]> {
  if (!bankApiEnabled) return []
  // TODO(bank): replace with the real statement/credits endpoint + auth scheme.
  // const res = await fetch(`${BASE}/credits?since=${sinceISO ?? ''}`, {
  //   headers: { Authorization: `Bearer ${KEY}` },
  // })
  // const json = await res.json()
  // return (json.records ?? []).map(parseIncomingPayment).filter(Boolean) as IncomingPayment[]
  console.warn('[bankApi] enabled but poll endpoint not yet implemented')
  return []
}
