import { createClient } from '@supabase/supabase-js'

/* Service-role client for server-only, no-session contexts (e.g. the Razorpay
   webhook, which has no logged-in user). It bypasses RLS, so it must NEVER be
   imported into anything that runs with user input in the browser. The key
   lives only in SUPABASE_SERVICE_ROLE_KEY, server-side. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
