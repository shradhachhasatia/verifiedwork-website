'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountActions() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.rpc('delete_current_user')
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="muted" style={{ fontSize: 13 }}>Delete everything?</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirming(false)}
          disabled={deleting}
        >
          Cancel
        </button>
        <button
          className="btn btn-sm pill"
          style={{ background: '#dc2626', color: '#fff', minWidth: 100 }}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <><span className="btn-spin" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> Deleting…</> : 'Yes, delete'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize: 12.5, color: 'var(--grey)' }}
        onClick={() => setConfirming(true)}
      >
        Delete account
      </button>
      <button className="btn btn-secondary btn-sm pill" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  )
}
