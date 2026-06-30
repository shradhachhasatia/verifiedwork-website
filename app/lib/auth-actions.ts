'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* Sign out on the server so the session cookies are cleared reliably (the
   browser client doesn't always clear the server-readable cookie, which left
   the proxy still seeing a session and bouncing the user back to /dashboard -
   making "Sign out" feel like it needed several clicks). Triggered from a
   <form action={signOut}>, so it works on the first click even before the
   page's JavaScript has hydrated. */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
