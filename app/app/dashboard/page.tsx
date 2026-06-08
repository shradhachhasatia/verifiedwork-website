import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // New users must finish onboarding before they reach the dashboard.
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, onboarded')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  const firstName = profile.full_name?.trim().split(/\s+/)[0]

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-lg font-medium text-gray-900">
          {firstName ? <>Welcome, <span className="text-black font-bold">{firstName}</span>.</> : <>You&apos;re logged in as <span className="text-black font-bold">{user.email}</span></>}
        </p>
        <p className="mt-1 text-sm text-gray-500">Your profile is saved. The dashboard is the next screen to build.</p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
