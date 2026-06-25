import { createClient } from '../../../lib/supabase/server'

const KIND_TONE: Record<string, string> = {
  advance: 'bg-amber-50 text-amber-700',
  full: 'bg-green-50 text-green-700',
  refund: 'bg-red-50 text-red-700',
}

export default async function AdminPayments() {
  const supabase = await createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, currency, kind, status, bank_ref, virtual_account_no, payer_name, received_at, agents:agent_id(full_name, agent_code), requests:request_id(title)')
    .order('received_at', { ascending: false })

  const total = (payments ?? []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const currency = payments && payments.length ? payments[0].currency : 'PKR'

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Payments</h1>
      <p className="text-sm text-slate-500">Credits captured automatically from the bank API against each agent’s virtual account, plus any manual entries.</p>

      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <div className="font-display text-3xl font-extrabold text-ink">{currency} {total.toLocaleString()}</div>
          <div className="mt-1 text-sm text-slate-500">Total received</div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <div className="font-display text-3xl font-extrabold text-ink">{payments?.length ?? 0}</div>
          <div className="mt-1 text-sm text-slate-500">Transactions</div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-card">
        {(!payments || payments.length === 0) ? (
          <p className="py-8 text-center text-slate-400">No payments recorded yet. Bank credits will appear here as they arrive.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="p-2">Date</th>
                  <th className="p-2">Agent</th>
                  <th className="p-2">Against</th>
                  <th className="p-2">Virtual a/c</th>
                  <th className="p-2">Bank ref</th>
                  <th className="p-2">Kind</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-2 text-slate-500">{new Date(p.received_at).toLocaleDateString()}</td>
                    <td className="p-2">{p.agents?.full_name ?? p.payer_name ?? '—'}{p.agents?.agent_code ? ` (${p.agents.agent_code})` : ''}</td>
                    <td className="p-2">{p.requests?.title ?? '—'}</td>
                    <td className="p-2 font-mono text-xs">{p.virtual_account_no ?? '—'}</td>
                    <td className="p-2 font-mono text-xs">{p.bank_ref ?? '—'}</td>
                    <td className="p-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${KIND_TONE[p.kind] ?? 'bg-slate-100 text-slate-600'}`}>{p.kind}</span>
                    </td>
                    <td className="p-2 text-right font-medium">{p.currency} {Number(p.amount).toLocaleString()}</td>
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
