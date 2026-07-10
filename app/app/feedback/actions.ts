'use server'

import { createClient } from '@/lib/supabase/server'
import { sendFeedbackEmail } from '@/lib/email'

const CATEGORIES = ['Idea', 'Bug', 'Praise', 'Other'] as const

export type FeedbackInput = {
  category: string
  message: string
  email: string
}

export async function submitFeedback(
  input: FeedbackInput,
): Promise<{ error: string } | { ok: true }> {
  const message = input.message.trim()
  if (message.length < 3) return { error: 'Please add a little more detail.' }
  if (message.length > 4000) return { error: 'That message is a bit long - please trim it.' }

  const category = CATEGORIES.includes(input.category as (typeof CATEGORIES)[number])
    ? input.category
    : 'Other'

  // Prefer the signed-in user's identity; fall back to a typed email.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let fromName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()
    fromName = profile?.full_name ?? ''
  }
  const fromEmail = (user?.email ?? input.email.trim()).trim()

  try {
    await sendFeedbackEmail({ category, message, fromName, fromEmail })
  } catch (err) {
    // Surface the real reason in the server logs (almost always a Resend
    // config issue: missing RESEND_API_KEY or an unverified sender domain)
    // while keeping the user-facing copy friendly.
    console.error('[feedback] send failed:', err)
    return { error: "We couldn't send your feedback just now. Please try again." }
  }

  return { ok: true }
}
