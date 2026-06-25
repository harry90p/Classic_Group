/**
 * Step 5 + 6: PNR watcher + reminder engine.
 * Run on a cPanel cron job, e.g. every 30 minutes:
 *   cd ~/app && ./node_modules/.bin/tsx scripts/pnr-watcher.ts
 *
 * 1. (Optional) sync PNRs from the Portal API into `pnrs`.
 * 2. For every pending PNR, schedule T-48h / T-24h reminders.
 * 3. Dispatch due reminders on BOTH channels (email + WhatsApp), idempotently.
 */
import { supabaseAdmin } from '../lib/supabase/admin'
import { syncPnrs } from '../lib/pnr/sync'
import { sendReminderEmail, emailEnabled } from '../lib/integrations/email'
import { sendReminderWhatsApp, whatsappEnabled } from '../lib/integrations/whatsapp'
import { pollBankCredits, bankApiEnabled } from '../lib/integrations/bankApi'
import { reconcilePayment } from '../lib/payments/reconcile'
import { notifyAgent } from '../lib/notify'

// Pull recent bank credits (when the bank has no webhook) and reconcile them
// against agent virtual accounts -> ledger + request payment_status.
async function pollPayments() {
  if (!bankApiEnabled) return
  const credits = await pollBankCredits()
  for (const c of credits) {
    try {
      await reconcilePayment(c)
    } catch (e) {
      console.error('[payments] reconcile failed:', (e as Error).message)
    }
  }
  if (credits.length) console.log(`Reconciled ${credits.length} bank credit(s).`)
}

const WINDOWS = (process.env.REMINDER_WINDOWS_HOURS || '48,24')
  .split(',')
  .map((h) => parseInt(h.trim(), 10))

const label = (h: number) => (h === 48 ? 'T-48h' : 'T-24h') as 'T-48h' | 'T-24h'
const payLabel = (h: number) => (h === 48 ? 'PAY-48h' : 'PAY-24h') as 'PAY-48h' | 'PAY-24h'

// Step (booking): in-app payment reminders for group bookings that still have an
// outstanding balance as their ticketing deadline approaches. Keyed on the
// booking's PNR with PAY-48h / PAY-24h windows so it never clashes with the
// ticketing-deadline reminders above.
async function dispatchPaymentReminders() {
  const now = Date.now()
  const { data: bookings, error } = await supabaseAdmin
    .from('group_bookings')
    .select('id, agent_id, fare_total, amount_received, currency, pnr_id, pnrs:pnr_id(expiry_at, pnr_code)')
    .neq('payment_status', 'full')
    .not('pnr_id', 'is', null)
    .gt('fare_total', 0)
  if (error) throw error

  for (const b of bookings ?? []) {
    const pnr = (b as any).pnrs
    if (!pnr?.expiry_at) continue
    const expiry = new Date(pnr.expiry_at as string).getTime()
    const total = Number(b.fare_total ?? 0)
    const received = Number(b.amount_received ?? 0)
    const remaining = Math.max(0, total - received)
    if (remaining <= 0) continue
    const cur = (b.currency as string) || 'PKR'

    for (const hours of WINDOWS) {
      const fireAt = expiry - hours * 3600_000
      if (now < fireAt || now >= expiry) continue // not in window / already past deadline
      const window = payLabel(hours)

      // Idempotent claim: unique(pnr_id, window, channel).
      const { error: claimErr } = await supabaseAdmin
        .from('reminders')
        .insert({ pnr_id: b.pnr_id, reminder_window: window, channel: 'inapp', state: 'scheduled' })
      if (claimErr) continue // already sent for this window

      try {
        await notifyAgent({
          agentId: b.agent_id as string,
          title: `Payment reminder — ${cur} ${remaining.toLocaleString()} outstanding`,
          body:
            `Your group booking (PNR ${pnr.pnr_code ?? ''}) has ${cur} ${remaining.toLocaleString()} ` +
            `remaining of ${cur} ${total.toLocaleString()}. ` +
            `Please clear the balance before the ticketing deadline on ${new Date(expiry).toLocaleString()}.`,
        })
        await supabaseAdmin
          .from('reminders')
          .update({ state: 'sent', sent_at: new Date().toISOString() })
          .match({ pnr_id: b.pnr_id, reminder_window: window, channel: 'inapp' })
      } catch (e) {
        await supabaseAdmin
          .from('reminders')
          .update({ state: 'failed', error: (e as Error).message })
          .match({ pnr_id: b.pnr_id, reminder_window: window, channel: 'inapp' })
      }
    }
  }
}

async function dispatchReminders() {
  const now = Date.now()
  const { data: pnrs, error } = await supabaseAdmin
    .from('pnrs')
    .select('id, pnr_code, airline, expiry_at, agent_id, agents(email, whatsapp_number)')
    .eq('status', 'pending')
    .not('expiry_at', 'is', null)
  if (error) throw error

  for (const pnr of pnrs ?? []) {
    const expiry = new Date(pnr.expiry_at as string).getTime()
    const agent = (pnr as any).agents
    for (const hours of WINDOWS) {
      const fireAt = expiry - hours * 3600_000
      if (now < fireAt || now >= expiry) continue // not in window yet / already expired
      const window = label(hours)

      for (const channel of ['email', 'whatsapp'] as const) {
        // Skip channels that aren't configured or have no contact on file.
        const ready =
          (channel === 'email' && emailEnabled && !!agent?.email) ||
          (channel === 'whatsapp' && whatsappEnabled && !!agent?.whatsapp_number)
        if (!ready) continue

        // Idempotent claim: unique(pnr_id, window, channel)
        const { error: claimErr } = await supabaseAdmin
          .from('reminders')
          .insert({ pnr_id: pnr.id, reminder_window: window, channel, state: 'scheduled' })
        if (claimErr) continue // already scheduled/sent — skip

        try {
          if (channel === 'email' && agent?.email) {
            await sendReminderEmail({
              to: agent.email,
              pnrCode: pnr.pnr_code as string,
              airline: pnr.airline as string,
              expiryAt: pnr.expiry_at as string,
              window,
            })
          } else if (channel === 'whatsapp' && agent?.whatsapp_number) {
            await sendReminderWhatsApp({
              to: agent.whatsapp_number,
              pnrCode: pnr.pnr_code as string,
              expiryAt: pnr.expiry_at as string,
              window,
            })
          }
          await supabaseAdmin
            .from('reminders')
            .update({ state: 'sent', sent_at: new Date().toISOString() })
            .match({ pnr_id: pnr.id, reminder_window: window, channel })
        } catch (e) {
          await supabaseAdmin
            .from('reminders')
            .update({ state: 'failed', error: (e as Error).message })
            .match({ pnr_id: pnr.id, reminder_window: window, channel })
        }
      }
    }
  }
}

async function main() {
  // Step 5: pull from every active source (manual is a no-op).
  const summary = await syncPnrs()
  console.log('PNR sync summary:', summary)
  // Bank payments: pull + reconcile recent credits (no-op without a webhook).
  await pollPayments()
  // Step 6: fire due ticketing-deadline reminders.
  await dispatchReminders()
  // Booking payments: nudge agents with an outstanding balance as the deadline nears.
  await dispatchPaymentReminders()
  console.log('PNR watcher run complete:', new Date().toISOString())
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
