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

  // The auth callback creates the row, but it may not exist yet if the user
  // reached onboarding another way, so handle both cases. We deliberately avoid
  // `.upsert()` here: an INSERT ... ON CONFLICT requires table-level SELECT,
  // which is intentionally withheld so the private `email` column stays hidden
  // from the API role. A plain UPDATE (no email) and a plain INSERT both work
  // under the per-column grants the app actually has.
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  const profile = {
    full_name,
    title,
    location: location || null,
    slug,
    photo_url: input.photo_url,
    onboarded: true,
  }

  const { error } = existing
    ? await supabase.from('users').update(profile).eq('id', user.id)
    : await supabase.from('users').insert({ id: user.id, email: user.email ?? '', ...profile })

  if (error) {
    if (error.code === '23505') {
      return { error: 'That profile link is already taken - try another.' }
    }
    return { error: "We couldn't save your profile just now. Please try again." }
  }

  redirect('/dashboard')
}
