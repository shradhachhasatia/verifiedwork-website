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
    .select('full_name, title, location, linkedin_url, website_url, website_label, photo_url, slug, onboarded, premium')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarded) redirect('/onboarding')

  // The purchase receipt, readable by its owner through RLS. Selected
  // defensively: this depends on a migration that is applied by hand, so
  // settings must still render if the table isn't there yet.
  const { data: receipt } = profile.premium
    ? await supabase
        .from('founding_members')
        .select('receipt_number, created_at, amount, currency, razorpay_payment_id')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

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
        membership={
          profile.premium
            ? {
                receiptNumber: receipt?.receipt_number ?? null,
                date: receipt?.created_at ?? null,
                amount: receipt?.amount ?? null,
                currency: receipt?.currency ?? null,
                paymentId: receipt?.razorpay_payment_id ?? null,
              }
            : null
        }
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
