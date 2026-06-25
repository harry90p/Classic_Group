// =====================================================================
// E-ticket storage helpers (private Supabase Storage bucket 'tickets').
// Tickets are never public; agents download them through short-lived signed
// URLs scoped to documents they own.
// =====================================================================
import { supabaseAdmin } from '../supabase/admin'

export const TICKETS_BUCKET = 'tickets'

// Upload an e-ticket PDF and return its object path.
export async function uploadTicketPdf(
  path: string,
  pdf: Buffer,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const { error } = await supabaseAdmin.storage
    .from(TICKETS_BUCKET)
    .upload(path, pdf, { contentType: 'application/pdf', upsert: true })
  if (error) return { ok: false, error: error.message }
  return { ok: true, path }
}

// Create a short-lived signed download URL for a stored ticket.
export async function signedTicketUrl(
  path: string,
  expiresInSeconds = 120,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(TICKETS_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data?.signedUrl ?? null
}
