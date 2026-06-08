'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* Slug rules mirror the mockup input mask: lowercase letters, numbers, hyphens. */
const slugOk = (v: string) => /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(v)

export type OnboardingInput = {
  full_name: string
  title: string
  location: string
  slug: string
  photo_url: string | null
}

/* Returns a friendly error string, or redirects to the dashboard on success.
   Raw Postgres / auth errors are never returned to the client. */
export async function completeOnboarding(
  input: OnboardingInput,
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const full_name = input.full_name.trim()
  const title = input.title.trim()
  const location = input.location.trim()
  const slug = input.slug.trim().toLowerCase()

  if (!full_name || !title) return { error: 'Please add your name and title.' }
  if (!slugOk(slug)) {
    return { error: 'Your profile link can only use letters, numbers and hyphens.' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name,
      title,
      location: location || null,
      slug,
      photo_url: input.photo_url,
      onboarded: true,
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'That profile link is already taken — try another.' }
    }
    return { error: "We couldn't save your profile just now. Please try again." }
  }

  redirect('/dashboard')
}
