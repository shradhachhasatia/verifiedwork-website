'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitVerification(
  token: string,
  data: {
    contribution: string
    outcomeAcc: string
    sentence: string
    rehire: string
  },
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()

  const { data: result, error } = await supabase.rpc('submit_verification', {
    p_token: token,
    p_contribution: data.contribution,
    p_outcome_acc: data.outcomeAcc,
    p_sentence: data.sentence,
    p_rehire: data.rehire,
  })

  if (error) return { error: "Something went wrong. Please try again." }
  if (result?.error === 'invalid_token') return { error: "This verification link has already been used or has expired." }
  if (result?.error) return { error: "Something went wrong. Please try again." }

  return { ok: true }
}
