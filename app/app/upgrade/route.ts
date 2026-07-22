import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createUpgradePaymentLink } from '@/lib/razorpay'
import { MIN_PROJECTS_FOR_PREMIUM } from '@/lib/format'

// @supabase/ssr needs Node, not Edge.
export const runtime = 'nodejs'

/* Entry point for "Become a founding member". Runs while the user is logged in,
   mints a per-user Razorpay payment link (with their id attached), and sends
   them to it. Razorpay's callback returns them to /dashboard?upgraded=1; the
   webhook is what actually flips them to premium. */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'verifiedwork.co'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const origin = `${proto}://${host}`

  if (!user) return NextResponse.redirect(`${origin}/login`)

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, premium')
    .eq('id', user.id)
    .single()

  if (profile?.premium) return NextResponse.redirect(`${origin}/dashboard?already=1`)

  // Founding-member pricing unlocks only once they have a few *verified*
  // projects, so they've actually proven work before paying. Enforced here (not
  // just in the UI) so it can't be bypassed by hitting /upgrade directly.
  const { count } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'verified')
  if ((count ?? 0) < MIN_PROJECTS_FOR_PREMIUM) {
    return NextResponse.redirect(`${origin}/dashboard?need_projects=1`)
  }

  const link = await createUpgradePaymentLink({
    userId: user.id,
    email: user.email ?? '',
    name: profile?.full_name ?? '',
    callbackUrl: `${origin}/dashboard?upgraded=1`,
  })

  if ('error' in link) {
    // Surface the real reason in the server logs so "We couldn't start checkout"
    // is diagnosable: 'not_configured' (missing RAZORPAY_KEY_ID/SECRET),
    // 'network', or the description Razorpay returned (e.g. currency/amount not
    // enabled on the account, invalid key, payment links not activated).
    console.error('[upgrade] payment link creation failed:', link.error)
    return NextResponse.redirect(`${origin}/dashboard?upgrade_error=1`)
  }
  return NextResponse.redirect(link.url)
}
