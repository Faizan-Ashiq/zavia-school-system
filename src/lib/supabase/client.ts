import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase client for use inside Client Components ('use client').
 * Reads the anon key + URL from env — never the service role key.
 *
 * Usage:
 *   const supabase = createClient()
 *   const { data } = await supabase.from('classes').select('*')
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}