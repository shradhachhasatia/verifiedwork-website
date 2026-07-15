'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { storagePathFromPublicUrl } from '@/lib/storage'
import { sendAccountDeletedEmail } from '@/lib/email'

export type SettingsInput = {
  full_name: string
  title: string
  location: string
  linkedin_url: string
  website_url: string
  website_label: string
  photo_url: string | null
}

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

export async function updateProfile(input: SettingsInput): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  const linkedin = input.linkedin_url.trim()
  if (linkedin && !linkedinOk(linkedin)) {
    return { error: 'Your LinkedIn link should contain linkedin.com.' }
  }
  const websiteRaw = input.website_url.trim()
  const website = websiteRaw ? normalizeUrl(websiteRaw) : null
  if (websiteRaw && !website) {
    return { error: "That website address doesn't look right. Try e.g. yoursite.com." }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: input.full_name.trim() || null,
      title: input.title.trim() || null,
      location: input.location.trim() || null,
      linkedin_url: linkedin || null,
      website_url: website,
      website_label: website ? (input.website_label === 'personal' ? 'personal' : 'company') : null,
      photo_url: input.photo_url,
    })
    .eq('id', user.id)

  if (error) return { error: "Couldn't save changes. Please try again." }
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteAccount(): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired.' }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, photo_url')
    .eq('id', user.id)
    .single()

  // Email comes from the auth session, not the users table - that column is no
  // longer exposed to the API role for privacy.
  if (user.email) {
    await sendAccountDeletedEmail({
      to: user.email,
      name: profile?.full_name?.split(' ')[0] ?? 'there',
    }).catch(() => {})
  }

  // Remove the user's Storage files before their rows disappear. The DB rows
  // (entries, validators, verifications) cascade when the account is deleted,
  // but Storage objects would otherwise be left orphaned. We derive the paths
  // from the saved public URLs so this needs only the owner DELETE policy.
  const { data: entries } = await supabase
    .from('entries')
    .select('artifact_url')
    .eq('user_id', user.id)

  const artifactPaths = (entries ?? [])
    .map((e) => storagePathFromPublicUrl(e.artifact_url, 'artifacts'))
    .filter((p): p is string => p !== null)
  if (artifactPaths.length) {
    await supabase.storage.from('artifacts').remove(artifactPaths)
  }

  const avatarPath = storagePathFromPublicUrl(profile?.photo_url, 'avatars')
  if (avatarPath) {
    await supabase.storage.from('avatars').remove([avatarPath])
  }

  const { error } = await supabase.rpc('delete_current_user')
  if (error) return { error: "Couldn't delete account. Please try again." }

  return { ok: true }
}
