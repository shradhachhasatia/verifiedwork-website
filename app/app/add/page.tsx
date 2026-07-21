import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FREE_PROJECT_LIMIT } from '@/lib/format'
import AddProjectWizard from './AddProjectWizard'

export default async function AddPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('onboarded, premium')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  // Free accounts are capped; bounce them back to the dashboard (which shows the
  // upgrade nudge) instead of letting them fill out a project they can't save.
  if (!profile.premium) {
    const { count } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= FREE_PROJECT_LIMIT) redirect('/dashboard?project_limit=1')
  }

  return (
    <main className="app-main">
      <AddProjectWizard selfEmail={user.email ?? ''} />
    </main>
  )
}
