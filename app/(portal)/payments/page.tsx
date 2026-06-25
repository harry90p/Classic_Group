export default function ViewPaymentsPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">View Payments</h1>
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y bg-slate-50 text-left text-slate-500">
                <th className="p-2">Date</th><th className="p-2">Bank</th><th className="p-2">Reference</th>
                <th className="p-2 text-right">Amount</th><th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={5} className="py-12 text-center text-slate-400">No payments submitted yet.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
