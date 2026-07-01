import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Wordmark } from '@/components/Icon'
import FeedbackForm from './FeedbackForm'

export const metadata = { title: 'Feedback - verified.work' }

export default async function FeedbackPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="app-main">
      <header className="app-head">
        <div className="inner">
          <Link href={user ? '/dashboard' : '/'} aria-label="verified.work" style={{ textDecoration: 'none' }}>
            <Wordmark />
          </Link>
          {user ? (
            <a href="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</a>
          ) : (
            <Link href="/login" className="btn btn-secondary btn-sm pill">Sign in</Link>
          )}
        </div>
      </header>
      <FeedbackForm initialEmail={user?.email ?? ''} loggedIn={!!user} />
    </main>
  )
}
