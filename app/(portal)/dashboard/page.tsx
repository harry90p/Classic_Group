import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import AnnouncementModal from '../../../components/AnnouncementModal'

const PAYMENT_ALERT_DAYS = 7
const IMG = '/assets/img'

const groupCards = [
  { name: 'KSA Groups', loc: 'Kingdom of Saudi Arabia', img: `${IMG}/destination/saudia.jpeg` },
  { name: 'UAE Groups', loc: 'United Arab Emirates', img: `${IMG}/destination/dubai.jpeg` },
  { name: 'Umrah Groups', loc: 'Makkah & Madinah', img: `${IMG}/Makkah.jpg` },
  { name: 'Oman Groups', loc: 'Oman', img: `${IMG}/destination/saudia.jpeg` },
  { name: 'Qatar Groups', loc: 'Qatar', img: `${IMG}/destination/dubai.jpeg` },
  { name: 'Bahrain Groups', loc: 'Bahrain', img: `${IMG}/destination/dubai.jpeg` },
  { name: 'UK Groups', loc: 'United Kingdom', img: `${IMG}/destination/malaysia.jpeg` },
  { name: 'All Groups', loc: 'All Groups', img: `${IMG}/destination/iran.jpeg` },
]

function audienceMatches(audience: string, role?: string, agentId?: string) {
  if (audience === 'all') return true
  if (role && audience === `role:${role}`) return true
  if (agentId && audience === `agent:${agentId}`) return true
  return false
}

export default async function Dashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: agent } = user
    ? await supabase.from('agents').select('id, role, full_name').eq('auth_user_id', user.id).maybeSingle()
    : { data: null as any }

  const { data: pnrs } = await supabase
    .from('pnrs')
    .select('pnr_code, airline, source, status, expiry_at')
    .eq('status', 'pending')
    .order('expiry_at', { ascending: true })

  const nowIso = new Date().toISOString()
  const { data: rawAnnouncements } = await supabase
    .from('announcements')
    .select('id, title, body, level, audience, starts_at, ends_at')
    .lte('starts_at', nowIso)
    .order('starts_at', { ascending: false })

  const { data: reads } = agent
    ? await supabase.from('announcement_reads').select('announcement_id').eq('agent_id', agent.id)
    : { data: [] as any[] }
  const readIds = new Set((reads ?? []).map((r: any) => r.announcement_id))

  const announcements = (rawAnnouncements ?? []).filter(
    (a: any) => (!a.ends_at || a.ends_at >= nowIso) && audienceMatches(a.audience, agent?.role, agent?.id),
  )
  const unread = announcements.filter((a: any) => !readIds.has(a.id))

  const cutoff = Date.now() + PAYMENT_ALERT_DAYS * 86400_000
  const paymentAlerts = (pnrs ?? [])
    .filter((p: any) => p.expiry_at && new Date(p.expiry_at).getTime() <= cutoff)
    .map((p: any) => ({ pnrCode: p.pnr_code, airline: p.airline, expiryAt: p.expiry_at }))

  return (
    <div className="p-4 sm:p-6">
      <AnnouncementModal announcements={unread} paymentAlerts={paymentAlerts} />

      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-2xl">
        <img src={`${IMG}/dubai-1.webp`} alt="" className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 to-ink/30" />
        <div className="absolute inset-0 flex flex-col justify-center px-6">
          <h1 className="font-display text-2xl font-extrabold text-gold-light sm:text-3xl">
            Welcome to Classic Group of Travels
          </h1>
          <p className="mt-1 text-sm text-white/80">Explore our premium travel groups to destinations worldwide</p>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-semibold">📣 News &amp; Announcements</h2>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div
                key={a.id}
                className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${
                  a.level === 'payment' ? 'border-red-500' : a.level === 'warning' ? 'border-amber-500' : 'border-sky-500'
                }`}
              >
                <div className="font-medium">{a.title}</div>
                {a.body && <p className="mt-1 text-sm text-slate-600">{a.body}</p>}
                <div className="mt-1 text-xs text-slate-400">{new Date(a.starts_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Group cards */}
      <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {groupCards.map((g) => (
          <div key={g.name} className="group relative overflow-hidden rounded-2xl shadow-card">
            <img src={g.img} alt={g.name} className="h-52 w-full object-cover transition duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
              <div className="font-display text-lg font-bold">{g.name}</div>
              <Link href="/groups" className="mt-2 inline-block rounded-md bg-gold px-4 py-1.5 text-xs font-semibold text-white hover:bg-gold-dark">
                View Details
              </Link>
              <div className="mt-2 text-xs text-white/80">📍 {g.loc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* PNR deadlines (extended feature) */}
      <section className="mt-8 rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Upcoming PNR Deadlines</h2>
          <Link href="/pnrs" className="text-sm font-semibold text-gold">View all →</Link>
        </div>
        {!pnrs || pnrs.length === 0 ? (
          <p className="py-6 text-center text-slate-500">No pending PNRs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="p-2">PNR</th><th className="p-2">Airline</th>
                  <th className="p-2">Source</th><th className="p-2">Status</th><th className="p-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {pnrs.map((p: any) => (
                  <tr key={p.pnr_code} className="border-b last:border-0">
                    <td className="p-2 font-mono">{p.pnr_code}</td>
                    <td className="p-2">{p.airline}</td>
                    <td className="p-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{p.source}</span></td>
                    <td className="p-2">{p.status}</td>
                    <td className="p-2">{p.expiry_at ? new Date(p.expiry_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
