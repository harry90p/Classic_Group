import { createClient } from '../../../lib/supabase/server'
import AnnouncementForm from '../../../components/admin/AnnouncementForm'
import DeleteAnnouncementButton from '../../../components/admin/DeleteAnnouncementButton'

const LEVEL_STYLES: Record<string, string> = {
  info: 'border-sky-500',
  warning: 'border-amber-500',
  payment: 'border-red-500',
}

function audienceLabel(a: string) {
  if (a === 'all') return 'All agents'
  if (a.startsWith('role:')) return `${a.slice(5).replace('_', ' ')} only`
  if (a.startsWith('agent:')) return 'Specific agent'
  return a
}

export default async function AdminAnnouncements() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('announcements')
    .select('id, title, body, level, audience, starts_at, ends_at')
    .order('starts_at', { ascending: false })

  const now = new Date().toISOString()

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">News &amp; Announcements</h1>
      <p className="text-sm text-slate-500">
        Publish news, newsletters and notification pop-ups for agents. (PNR payment-deadline reminders are automatic and
        appear on each agent&apos;s own portal — they are not managed here.)
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold">Publish new</h2>
          <AnnouncementForm />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold">Published ({items?.length ?? 0})</h2>
          {!items || items.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((a: any) => {
                const expired = a.ends_at && a.ends_at < now
                return (
                  <div key={a.id} className={`rounded-xl border-l-4 bg-slate-50 p-4 ${LEVEL_STYLES[a.level] ?? 'border-slate-400'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">
                        {a.title}
                        {expired && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">expired</span>}
                      </div>
                      <DeleteAnnouncementButton id={a.id} />
                    </div>
                    {a.body && <p className="mt-1 text-sm text-slate-600">{a.body}</p>}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="rounded bg-white px-2 py-0.5 capitalize">{a.level}</span>
                      <span className="rounded bg-white px-2 py-0.5">{audienceLabel(a.audience)}</span>
                      <span>{new Date(a.starts_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
