import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, photo_url, onboarded')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded) redirect('/dashboard')

  return (
    <main className="app-main">
      <OnboardingWizard
        initialName={profile?.full_name ?? ''}
        initialPhotoUrl={profile?.photo_url ?? null}
      />
    </main>
  )
}
