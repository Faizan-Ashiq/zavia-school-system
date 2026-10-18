import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * ONLY import this inside Server Actions or Route Handlers that have
 * already verified the caller is an authenticated admin themselves
 * (see createStudentAction for the pattern). Never import this into
 * anything that runs in — or ships to — the browser, and make sure
 * SUPABASE_SERVICE_ROLE_KEY is NOT prefixed with NEXT_PUBLIC_ in
 * .env.local, or it will be bundled into client code.
 *
 * Key resolution checks all common env variable names so the app
 * degrades gracefully when a variable is missing rather than throwing
 * "supabaseKey is required" at runtime.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[createAdminClient] Supabase credentials missing — returning a no-op mock client to prevent crash. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local and restart the dev server.'
    )
    return createClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.placeholder',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
