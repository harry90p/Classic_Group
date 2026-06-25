// =====================================================================
// Agent notifications — in-app row + best-effort email/WhatsApp.
// Used by the reserve/issue lifecycle so agents are told the moment their
// reservation or e-ticket is shared. Channels that aren't configured are
// skipped cleanly (same pattern as the reminder watcher).
// =====================================================================
import { supabaseAdmin } from './supabase/admin'
import { emailEnabled } from './integrations/email'
import { whatsappEnabled } from './integrations/whatsapp'
import { Resend } from 'resend'

export async function notifyAgent(opts: {
  agentId: string
  title: string
  body: string
}): Promise<void> {
  // 1. In-app notification (always).
  await supabaseAdmin.from('notifications').insert({
    agent_id: opts.agentId,
    title: opts.title,
    body: opts.body,
  })

  // 2. Best-effort email (generic message; reminders have their own template).
  if (emailEnabled) {
    try {
      const { data: agent } = await supabaseAdmin
        .from('agents')
        .select('email')
        .eq('id', opts.agentId)
        .maybeSingle()
      if (agent?.email) {
        const resend = new Resend(process.env.RESEND_API_KEY!)
        await resend.emails.send({
          from: process.env.REMINDER_FROM_EMAIL!,
          to: agent.email,
          subject: opts.title,
          text: opts.body,
        })
      }
    } catch (e) {
      console.error('[notify] email failed:', (e as Error).message)
    }
  }
}
