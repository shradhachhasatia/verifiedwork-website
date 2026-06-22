'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteEntry(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  // Remove child rows first (RLS scopes each delete to rows the user owns),
  // then the entry itself — so it works whether or not the FKs cascade.
  await supabase.from('verifications').delete().eq('entry_id', id)
  await supabase.from('validators').delete().eq('entry_id', id)

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: "Couldn't delete the project. Please try again." }

  revalidatePath('/dashboard')
  return { ok: true }
}
