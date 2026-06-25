import { NextResponse } from 'next/server'
import { syncPnrs } from '../../../../lib/pnr/sync'

// Options B/C — manual trigger to poll the active external sources
// (amadeus / portal) and upsert into `pnrs`. Also runs automatically on the
// cron via scripts/pnr-watcher.ts. Protect with SYNC_SECRET in production.
export async function POST(request: Request) {
  const secret = process.env.SYNC_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  const summary = await syncPnrs()
  return NextResponse.json({ ok: true, summary })
}
