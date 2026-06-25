// Financial-data API client (server-only). For balances, commissions, notifications.
const BASE = process.env.FINANCIAL_API_BASE
const KEY = process.env.FINANCIAL_API_KEY

export async function getAgentBalance(agentRef: string): Promise<number | null> {
  if (!BASE || !KEY) return null
  const res = await fetch(`${BASE}/agents/${encodeURIComponent(agentRef)}/balance`, {
    headers: { Authorization: `Bearer ${KEY}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Financial API ${res.status}`)
  const json = (await res.json()) as { balance: number }
  return json.balance
}
