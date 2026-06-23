'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { storagePathFromPublicUrl } from '@/lib/storage'

export async function deleteEntry(id: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expired. Please sign in again.' }

  // Read the artifact first so we can remove the uploaded file too — deleting
  // the row alone would orphan the object in Storage.
  const { data: entry } = await supabase
    .from('entries')
    .select('artifact_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

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

  // Clean up the uploaded artifact in Storage (no-op for link artifacts).
  const artifactPath = storagePathFromPublicUrl(entry?.artifact_url, 'artifacts')
  if (artifactPath) {
    await supabase.storage.from('artifacts').remove([artifactPath])
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
