import { createClient } from '@supabase/supabase-js'

// Service-role client for trusted server jobs (cron watcher). Bypasses RLS.
// NEVER import this into client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)
