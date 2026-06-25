export default function LedgerPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Account Ledger</h1>
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-end gap-3 border-b pb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500">From Date</label>
            <input type="date" className="field mt-1" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">To Date</label>
            <input type="date" className="field mt-1" />
          </div>
          <button className="btn-gold">Filter</button>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm font-semibold">
          <span>Opening Balance</span><span>0.00 CR</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y bg-slate-50 text-left text-slate-500">
                <th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Description</th>
                <th className="p-2 text-right">Debit</th><th className="p-2 text-right">Credit</th><th className="p-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">No transactions in this period.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm font-semibold">
          <span>Closing Balance</span><span>0.00 CR</span>
        </div>
      </div>
    </div>
  )
}
