import { createClient } from '../../../lib/supabase/server'

export default async function BanksPage() {
  const supabase = await createClient()
  const { data: banks } = await supabase
    .from('banks')
    .select('id, bank_name, title, account_no, iban')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Bank Accounts</h1>
      <p className="mt-1 text-sm text-slate-500">Company collection accounts for submitting your payments. Always quote your Agent ID with every transfer so we can match the payment to your account.</p>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card">
        {(!banks || banks.length === 0) ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
            <div className="text-4xl">🏦</div>
            <h2 className="mt-3 font-display text-lg font-semibold">No bank accounts listed yet</h2>
            <p className="mt-1 text-sm text-slate-500">Company bank details will appear here once added by admin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="p-3">#</th>
                  <th className="p-3">Bank</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Account #</th>
                  <th className="p-3">IBAN</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((b: any, i: number) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="p-3 text-slate-400">{i + 1}</td>
                    <td className="p-3 font-semibold text-ink">{b.bank_name}</td>
                    <td className="p-3">{b.title}</td>
                    <td className="p-3 font-mono text-xs">{b.account_no}</td>
                    <td className="p-3 font-mono text-xs">{b.iban}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
