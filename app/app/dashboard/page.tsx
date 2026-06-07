import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-lg font-medium text-gray-900">
          You&apos;re logged in as <span className="text-black font-bold">{user.email}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">Auth is working end-to-end.</p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
