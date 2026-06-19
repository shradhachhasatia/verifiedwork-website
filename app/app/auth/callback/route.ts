import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  // Two sign-in paths land here:
  //   • `code`       - PKCE (OAuth + same-device magic link). The code verifier
  //                    lives in this browser's cookies, so it only completes on
  //                    the device that started the sign-in.
  //   • `token_hash` - emailed one-time token. Verifies server-side with no
  //                    browser-stored secret, so the magic link works even when
  //                    opened on a *different* device (e.g. requested on a
  //                    laptop, opened on a phone). Requires the Supabase email
  //                    templates to point here with ?token_hash=…&type=email.
  let user = null
  let authError: { message?: string } | null = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    user = data.user ?? null
    authError = error
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    user = data.user ?? null
    authError = error
  }

  if (!authError && user) {
    const email = user.email ?? ''
    const fullName = user.user_metadata?.full_name as string | undefined
    const nameParts = fullName?.trim().split(/\s+/) ?? email.split('@')[0].split('.')
    const first = (nameParts[0] ?? 'user').toLowerCase().replace(/[^a-z0-9]/g, '')
    const last = (nameParts[1] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const rand = Math.random().toString(36).slice(2, 7)
    const slug = [first, last, rand].filter(Boolean).join('-')

    const { data: existing } = await supabase
      .from('users')
      .select('onboarded')
      .eq('id', user.id)
      .single()

    await supabase.from('users').upsert(
      { id: user.id, email, full_name: fullName ?? null, slug },
      { onConflict: 'id', ignoreDuplicates: true },
    )

    const dest = existing?.onboarded ? '/dashboard' : '/onboarding'
    return NextResponse.redirect(`${origin}${dest}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
