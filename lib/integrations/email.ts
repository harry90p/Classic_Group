import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const from = process.env.REMINDER_FROM_EMAIL

// True only when Resend is configured. The watcher uses this to skip the email
// channel cleanly in demo mode instead of recording failures.
export const emailEnabled = Boolean(apiKey && from)

const resend = apiKey ? new Resend(apiKey) : null

export async function sendReminderEmail(opts: {
  to: string
  pnrCode: string
  airline?: string
  expiryAt: string
  window: 'T-48h' | 'T-24h'
}) {
  if (!resend || !from) throw new Error('Email not configured')
  const when = opts.window === 'T-48h' ? '2 days' : '24 hours'
  return resend.emails.send({
    from,
    to: opts.to,
    subject: `Payment due — PNR ${opts.pnrCode} expires in ${when}`,
    text:
      `Reminder: PNR ${opts.pnrCode}${opts.airline ? ` (${opts.airline})` : ''} ` +
      `is due for ticket issuance / payment submission and will expire at ` +
      `${opts.expiryAt}. Please submit payment to avoid auto-cancellation.`,
  })
}
