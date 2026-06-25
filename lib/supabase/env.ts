// Centralized Supabase env access so the app can boot (and show a friendly
// setup notice) even before keys are configured — instead of hard-crashing.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Official company email domain. Only addresses on this domain can be granted
// limited ADMIN access (issuance / reservation / holds). Configurable via env.
export const COMPANY_EMAIL_DOMAIN = (
  process.env.COMPANY_EMAIL_DOMAIN ?? 'classicgroupoftravels.com'
).toLowerCase().replace(/^@/, '')

export function isCompanyEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase().endsWith('@' + COMPANY_EMAIL_DOMAIN)
}

// Bootstrap admin emails: these accounts are ALWAYS treated as admin on login,
// and the app self-heals their agent row to admin in whatever Supabase project
// it is connected to. This guarantees the owner can always get into the admin
// console regardless of seed/migration/project mixups. Comma-separated; falls
// back to the company super-admin address.
export const BOOTSTRAP_ADMIN_EMAILS = (
  process.env.BOOTSTRAP_ADMIN_EMAILS ?? 'admin@classicgroupoftravels.com'
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export function isBootstrapAdminEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false
  return BOOTSTRAP_ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
