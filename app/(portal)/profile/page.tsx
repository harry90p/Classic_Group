import { createClient } from '../../../lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: agent } = user
    ? await supabase.from('agents').select('*').eq('auth_user_id', user.id).single()
    : { data: null as any }

  const fields: Array<[string, string]> = [
    ['User Name', agent?.username ?? ''],
    ['Email', user?.email ?? ''],
    ['First Name', agent?.first_name ?? ''],
    ['Last Name', agent?.last_name ?? ''],
    ['Agency Name', agent?.agency_name ?? ''],
    ['Phone', agent?.phone ?? ''],
    ['WhatsApp', agent?.whatsapp ?? ''],
    ['City', agent?.city ?? ''],
    ['Province', agent?.province ?? ''],
    ['Country', agent?.country ?? ''],
  ]

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Agent Details</h1>
      <div className="mt-4 max-w-3xl rounded-2xl bg-white p-6 shadow-card">
        <form className="grid gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-slate-500">{label}</label>
              <input className="field mt-1" defaultValue={value} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500">Address</label>
            <input className="field mt-1" defaultValue={agent?.address ?? ''} />
          </div>
          <button type="button" className="btn-gold sm:col-span-2 sm:w-max">Update</button>
        </form>
      </div>
    </div>
  )
}
