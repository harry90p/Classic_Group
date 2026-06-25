// WhatsApp Business Cloud API — template message dispatch (server-only).
const TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const TEMPLATE = process.env.WHATSAPP_REMINDER_TEMPLATE || 'pnr_deadline_reminder'
const GRAPH = 'https://graph.facebook.com/v20.0'

// True only when WhatsApp Cloud API is configured (used by the watcher to skip
// the channel cleanly in demo mode).
export const whatsappEnabled = Boolean(TOKEN && PHONE_ID)

export async function sendReminderWhatsApp(opts: {
  to: string // E.164, e.g. 9230xxxxxxx
  pnrCode: string
  expiryAt: string
  window: 'T-48h' | 'T-24h'
}) {
  if (!TOKEN || !PHONE_ID) throw new Error('WhatsApp not configured')
  const when = opts.window === 'T-48h' ? '2 days' : '24 hours'
  const res = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: opts.to,
      type: 'template',
      template: {
        name: TEMPLATE,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: opts.pnrCode },
              { type: 'text', text: when },
              { type: 'text', text: opts.expiryAt },
            ],
          },
        ],
      },
    }),
  })
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`)
  return res.json()
}
