/** Extracts the object path from a Supabase public Storage URL for a given
 *  bucket, or null if the URL doesn't point at an object in that bucket.
 *
 *  e.g. https://x.supabase.co/storage/v1/object/public/avatars/<uid>/123.jpg
 *       -> "<uid>/123.jpg"
 *
 *  Used so that deleting a row also removes the file it referenced, instead of
 *  leaving it orphaned in Storage.
 */
export function storagePathFromPublicUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  const rest = url.slice(i + marker.length).split('?')[0]
  if (!rest) return null
  try {
    return decodeURIComponent(rest)
  } catch {
    return rest
  }
}
