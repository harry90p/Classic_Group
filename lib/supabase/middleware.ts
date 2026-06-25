import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

// Paths that are always reachable on the admin subdomain (auth + assets).
// NOTE: /register is intentionally NOT here — partners/staff register on the
// main site, so on admin.<domain> a /register hit is bounced to the console.
const PASSTHROUGH = ['/login', '/post-login', '/api', '/_next', '/assets', '/favicon']
function isPassthrough(path: string) {
  return PASSTHROUGH.some((p) => path === p || path.startsWith(p + '/'))
}

// Agent-portal areas. These must NEVER render on the admin subdomain.
const PORTAL_PREFIXES = [
  '/dashboard', '/bookings', '/groups', '/pnrs', '/packages',
  '/payments', '/ledger', '/banks', '/profile', '/change-password',
]

// Refreshes the Supabase session on every request, isolates the admin
// subdomain from the agent portal, and guards protected routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const rawHost = request.headers.get('host') || ''
  const hostname = rawHost.split(':')[0]
  const isAdminHost = hostname.startsWith('admin.')
  const path = request.nextUrl.pathname

  const adminUrl = () => {
    const u = request.nextUrl.clone()
    u.pathname = '/admin'
    u.search = ''
    return u
  }

  // --- Admin subdomain isolation -----------------------------------------
  // On admin.<domain>, ONLY the admin console (+ auth/assets) is reachable.
  //   • "/"                  -> rewrite to /admin (URL stays admin.<domain>/)
  //   • anything non-/admin  -> redirect to /admin (kills agent-portal & marketing
  //                              pages like /dashboard or /about on this host)
  let adminHostRewrite = false
  if (isAdminHost && !isPassthrough(path)) {
    if (path === '/') {
      response = NextResponse.rewrite(adminUrl())
      adminHostRewrite = true
    } else if (!path.startsWith('/admin')) {
      return NextResponse.redirect(adminUrl())
    }
  }

  // Until Supabase keys are set, skip auth entirely so the app still boots.
  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value))
        const next = adminHostRewrite
          ? NextResponse.rewrite(adminUrl())
          : NextResponse.next({ request })
        toSet.forEach(({ name, value, options }) => next.cookies.set(name, value, options))
        response = next
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth guard for protected areas (the page layouts add role checks on top).
  const needsAuth =
    (isAdminHost && path === '/') ||
    path === '/admin' ||
    path.startsWith('/admin/') ||
    PORTAL_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))

  if (!user && needsAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}
