import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AddProjectWizard from './AddProjectWizard'

export default async function AddPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  return (
    <main className="app-main">
      <AddProjectWizard userId={user.id} selfEmail={user.email ?? ''} />
    </main>
  )
}
