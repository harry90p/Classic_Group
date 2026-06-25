export default function AddPaymentPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Add Payment</h1>
      <div className="mt-4 max-w-2xl rounded-2xl bg-white p-6 shadow-card">
        <form className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-500">Bank Account</label>
            <select className="field mt-1"><option>Select bank account</option></select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Amount (PKR)</label>
            <input className="field mt-1" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Transaction / Reference No.</label>
            <input className="field mt-1" placeholder="e.g. TRX-100245" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500">Payment Date</label>
            <input type="date" className="field mt-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500">Upload Slip</label>
            <input type="file" className="mt-1 block w-full text-sm" />
          </div>
          <button type="button" className="btn-gold sm:col-span-2 sm:w-max">Submit Payment</button>
        </form>
        <p className="mt-3 text-xs text-slate-400">Demo form — payment submission will be wired to the ledger in a later step.</p>
      </div>
    </div>
  )
}
