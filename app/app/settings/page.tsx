import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Wordmark } from '@/components/Icon'
import SettingsView from './SettingsView'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, title, location, linkedin_url, website_url, website_label, photo_url, slug, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  return (
    <main className="app-main">
      <header className="app-head">
        <div className="inner">
          <Link href="/dashboard" aria-label="verified.work" style={{ textDecoration: 'none' }}><Wordmark /></Link>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
        </div>
      </header>
      <SettingsView
        slug={profile.slug ?? ''}
        initial={{
          full_name: profile.full_name ?? '',
          title: profile.title ?? '',
          location: profile.location ?? '',
          linkedin_url: profile.linkedin_url ?? '',
          website_url: profile.website_url ?? '',
          website_label: profile.website_label ?? 'company',
          photo_url: profile.photo_url ?? null,
        }}
      />
    </main>
  )
}
