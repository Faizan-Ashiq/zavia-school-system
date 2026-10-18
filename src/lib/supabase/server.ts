import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase client for use inside Server Components, Server Actions, and
 * Route Handlers. Wires cookie read/write through Next's `cookies()` so
 * the user's session travels with every server-side request.
 *
 * `setAll` is wrapped in try/catch because Server Components are only
 * allowed to *read* cookies — writes there are a no-op that Next throws
 * on. That's fine as long as middleware.ts is also refreshing the
 * session on every request (which it does), so a Server Component
 * doesn't need to write cookies itself.
 *
 * Key resolution checks all common env variable names so the app
 * degrades gracefully when a variable is missing rather than throwing
 * "supabaseKey is required" at runtime.
 *
 * Usage:
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[createClient] Supabase credentials missing — returning a no-op mock client to prevent crash. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server.'
    )
    // Return a structurally valid but inert client so callers don't crash
    return createServerClient(
      'https://placeholder.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder',
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component — safe to ignore because
          // middleware.ts refreshes the session cookie on every request.
        }
      },
    },
  })
}