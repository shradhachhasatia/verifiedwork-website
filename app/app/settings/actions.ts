'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendAccountDeletedEmail } from '@/lib/email'

export type SettingsInput = {
  full_name: string
  title: string
  location: string
  linkedin_url: string
  photo_url: string | null
}

export async function updateProfile(input: SettingsInput): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: input.full_name.trim() || null,
      title: input.title.trim() || null,
      location: input.location.trim() || null,
      linkedin_url: input.linkedin_url.trim() || null,
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
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.email) {
    await sendAccountDeletedEmail({
      to: profile.email,
      name: profile.full_name?.split(' ')[0] ?? 'there',
    }).catch(() => {})
  }

  const { error } = await supabase.rpc('delete_current_user')
  if (error) return { error: "Couldn't delete account. Please try again." }

  return { ok: true }
}
