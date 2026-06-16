'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountActions() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <button className="btn btn-secondary btn-sm pill" onClick={handleSignOut}>
      Sign out
    </button>
  )
}
