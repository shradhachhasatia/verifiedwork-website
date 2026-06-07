import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user) {
      // Auto-create users row on first login
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        const email = user.email ?? ''
        const fullName = user.user_metadata?.full_name as string | undefined
        const nameParts = fullName?.trim().split(/\s+/) ?? email.split('@')[0].split('.')
        const first = (nameParts[0] ?? 'user').toLowerCase().replace(/[^a-z0-9]/g, '')
        const last = (nameParts[1] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const rand = Math.random().toString(36).slice(2, 7)
        const slug = [first, last, rand].filter(Boolean).join('-')

        await supabase.from('users').insert({
          id: user.id,
          email,
          full_name: fullName ?? null,
          slug,
        })
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
