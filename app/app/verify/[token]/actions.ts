'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { sendVerifiedEmail } from '@/lib/email'

export async function submitVerification(
  token: string,
  data: {
    contribution: string
    outcomeAcc: string
    sentence: string
    rehire: string
    validatorName: string
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

  if (result?.owner_email) {
    const hdrs = await headers()
    const host = hdrs.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const profileUrl = `${proto}://${host}`

    sendVerifiedEmail({
      to: result.owner_email,
      ownerName: result.owner_name ?? '',
      validatorName: data.validatorName,
      roleTitle: result.role_title ?? '',
      company: result.company ?? '',
      profileUrl,
    }).catch(() => {})
  }

  return { ok: true }
}
