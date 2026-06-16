import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
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
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
