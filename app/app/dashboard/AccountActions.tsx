'use client'

import { createClient } from '@/lib/supabase/client'

export default function AccountActions() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Full document load (not router.push) so Next's client cache is wiped and
    // the back button can't restore the signed-in dashboard. `replace` also
    // drops this page from history so "back" never lands on it.
    window.location.replace('/login')
  }

  return (
    <button className="btn btn-secondary btn-sm pill" onClick={handleSignOut}>
      Sign out
    </button>
  )
}
