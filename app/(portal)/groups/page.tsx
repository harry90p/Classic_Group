const filters = ['All Groups', 'KSA', 'UAE', 'Umrah', 'Oman', 'Qatar', 'Bahrain', 'UK']

export default function GroupsPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Group Flight Tickets</h1>
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">Filter by Destination:</span>
          {filters.map((f, i) => (
            <button
              key={f}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                i === 0 ? 'bg-gold text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <div className="text-4xl">🛩️</div>
          <h2 className="mt-3 font-display text-lg font-semibold">No Group Flights Available</h2>
          <p className="mt-1 text-sm text-slate-500">Please try different filters or check back later.</p>
        </div>
      </div>
    </div>
  )
}
