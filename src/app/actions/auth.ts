'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Signs the current user out and sends them back to /login.
 * Bound directly to a <form action={signOutAction}> in the portal
 * shells so it works even without client-side JS.
 */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
