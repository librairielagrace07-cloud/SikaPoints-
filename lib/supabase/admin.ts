import { createClient } from '@supabase/supabase-js'

// Client avec service role key — bypasse RLS et email confirmation
// Utiliser UNIQUEMENT dans les Server Actions côté serveur
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
