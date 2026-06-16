'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
