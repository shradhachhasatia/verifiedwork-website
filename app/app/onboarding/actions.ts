'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Handles become verified.work/<slug>, so they must not collide with real
// routes. Keep this in step with RESERVED_HANDLES in OnboardingWizard.tsx.
const RESERVED_HANDLES = new Set([
  'login', 'logout', 'signup', 'signin', 'dashboard', 'settings', 'onboarding',
  'add', 'demo', 'feedback', 'verify', 'api', 'auth', 'admin', 'app', 'blog',
  'privacy', 'terms', 'careers', 'about', 'help', 'support', 'contact', 'home',
  'index', 'profile', 'user', 'users', 'me', 'new', 'edit', 'assets',
])

/* Slug rules: 3-30 chars, lowercase letters/numbers/hyphens, must start and end
   alphanumeric, no double hyphens, and not a reserved route name. */
const slugOk = (v: string) =>
  /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(v) && !/--/.test(v) && !RESERVED_HANDLES.has(v)

const linkedinOk = (v: string) => /linkedin\.com/i.test(v)

/* Accept a bare domain or a full URL; returns a normalised https URL or null. */
function normalizeUrl(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
  try {
    const u = new URL(withProto)
    if (!u.hostname.includes('.')) return null
    return u.toString()
  } catch {
    return null
  }
}

export type OnboardingInput = {
  full_name: string
  title: string
  location: string
  slug: string
  photo_url: string | null
  linkedin_url: string
  website_url: string
  website_label: string
}

/* Is this handle free? Runs through a SECURITY DEFINER function so it can see
   handles taken by users who haven't finished onboarding yet (RLS hides those
   from a normal query). */
export async function checkSlug(slug: string): Promise<{ available: boolean }> {
  const s = slug.trim().toLowerCase()
  if (!slugOk(s)) return { available: false }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('slug_available', { p_slug: s })
  if (error) return { available: true } // don't block on a check failure; the unique index is the backstop
  return { available: data === true }
}

/* Suggest a free handle derived from a base (e.g. the person's name). */
export async function suggestSlug(base: string): Promise<{ slug: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('suggest_slug', { p_base: base })
  if (error || typeof data !== 'string') {
    return { slug: base.toLowerCase().replace(/[^a-z0-9-]/g, '') }
  }
  return { slug: data }
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
  const linkedin_raw = input.linkedin_url.trim()
  const website_raw = input.website_url.trim()

  if (!full_name || !title) return { error: 'Please add your name and title.' }
  if (!slugOk(slug)) {
    return { error: 'Please choose a valid profile link: 3-30 letters, numbers or hyphens, and not a reserved word.' }
  }
  if (linkedin_raw && !linkedinOk(linkedin_raw)) {
    return { error: 'Your LinkedIn link should contain linkedin.com.' }
  }
  const website_url = website_raw ? normalizeUrl(website_raw) : null
  if (website_raw && !website_url) {
    return { error: "That website address doesn't look right. Try e.g. yoursite.com." }
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
    linkedin_url: linkedin_raw || null,
    website_url,
    website_label: website_url ? (input.website_label === 'personal' ? 'personal' : 'company') : null,
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
