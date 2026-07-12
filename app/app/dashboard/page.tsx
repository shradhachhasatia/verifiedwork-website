import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Wordmark, Icon } from '@/components/Icon'
import DashboardView, { type Entry } from './DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // New users must finish onboarding before they reach the dashboard.
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const { data: entries } = await supabase
    .from('entries')
    .select('id, role_title, company, start_date, end_date, contribution, metrics, artifact_url, status, validators(name, role, linkedin), verifications(sentence, rehire)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? ''

  return (
    <main className="app-main">
      <header className="app-head">
        <div className="inner">
          <Link href="/dashboard" aria-label="verified.work" style={{ textDecoration: 'none' }}><Wordmark /></Link>
          <a href="/settings" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999 }}>
            <Icon name="user" size={15} /> Account
          </a>
        </div>
      </header>
      <DashboardView firstName={firstName} entries={(entries ?? []) as Entry[]} />
    </main>
  )
}
