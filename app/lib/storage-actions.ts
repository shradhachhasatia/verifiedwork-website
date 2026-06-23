'use server'

import { createClient } from '@/lib/supabase/server'

/* Buckets the client is allowed to request an upload URL for. */
const ALLOWED_BUCKETS = ['avatars', 'artifacts'] as const
type Bucket = (typeof ALLOWED_BUCKETS)[number]

export type SignedUpload = { path: string; token: string }

/* Mints a one-time signed upload URL for the signed-in user.
 *
 * Uploads run from the browser, where the Supabase client has no session, so a
 * direct `.upload()` reaches Storage as the `anon` role and is rejected by RLS
 * ("new row violates row-level security policy"). Here we run on the server,
 * where the session is available, and hand the browser a short-lived token it
 * can upload against. The object always lands in the user's own folder, which
 * is exactly what the Storage RLS policies require.
 */
export async function createUploadUrl(
  bucket: Bucket,
  ext: string,
): Promise<SignedUpload | { error: string }> {
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return { error: 'That upload location is not allowed.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const safeExt = (ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin'
  const path = `${user.id}/${Date.now()}.${safeExt}`

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
  if (error || !data) {
    return { error: "We couldn't start the upload. Please try again." }
  }

  return { path: data.path, token: data.token }
}
