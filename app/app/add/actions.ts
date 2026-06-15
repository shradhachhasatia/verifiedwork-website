'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { badgeTier, emailOk, yearToStartDate, yearToEndDate } from '@/lib/format'
import { sendVerificationEmail } from '@/lib/email'

export type AddProjectInput = {
  title: string
  company: string
  startYear: string
  endYear: string
  contrib: string
  description: string
  outcome: string
  artifactUrl: string | null
  vName: string
  vRel: string
  vRole: string
  vEmail: string
  vLink: string
  vNote: string
}

// Creates a work entry plus the validator who'll verify it. The entry is
// saved as `pending`; the actual verification email is sent later once
// transactional email (Resend) is wired up.
export async function createEntry(
  input: AddProjectInput,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  if (!input.title.trim() || !input.company.trim() || !input.startYear) {
    return { error: 'Please complete the project details.' }
  }
  if (!input.description.trim() || !input.outcome.trim()) {
    return { error: 'Please describe what you did and the outcome.' }
  }
  if (!input.vName.trim() || !input.vRole.trim() || !emailOk(input.vEmail)) {
    return { error: 'Please add a valid name, role and email for your validator.' }
  }
  if (input.vEmail.trim().toLowerCase() === (user.email ?? '').toLowerCase()) {
    return { error: "You can't verify your own work — use someone else's email." }
  }

  const { data: entry, error: entryErr } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      role_title: input.title.trim(),
      company: input.company.trim(),
      start_date: yearToStartDate(input.startYear),
      end_date: yearToEndDate(input.endYear),
      contribution: input.contrib.toLowerCase(),
      work_done: input.description.trim(),
      metrics: input.outcome.trim(),
      artifact_url: input.artifactUrl,
      status: 'pending',
    })
    .select('id')
    .single()

  if (entryErr || !entry) {
    return { error: "We couldn't save your project just now. Please try again." }
  }

  const tier = badgeTier(input.vEmail)
  const { error: valErr } = await supabase.from('validators').insert({
    entry_id: entry.id,
    name: input.vName.trim(),
    email: input.vEmail.trim(),
    relationship: input.vRel,
    role: input.vRole.trim(),
    linkedin: input.vLink.trim() || null,
    note: input.vNote.trim() || null,
    is_institutional: tier ? tier.kind !== 'peer' : false,
  })

  if (valErr) {
    await supabase.from('entries').delete().eq('id', entry.id)
    return { error: "We couldn't save the validator details. Please try again." }
  }

  // Fetch the token we need to build the verification link
  const { data: validator } = await supabase
    .from('validators')
    .select('token')
    .eq('entry_id', entry.id)
    .single()

  if (validator?.token) {
    const hdrs = await headers()
    const host = hdrs.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const verifyUrl = `${proto}://${host}/verify/${validator.token}`

    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    await sendVerificationEmail({
      to: input.vEmail.trim(),
      validatorName: input.vName.trim(),
      ownerName: profile?.full_name ?? 'Someone',
      roleTitle: input.title.trim(),
      company: input.company.trim(),
      workDone: input.description.trim(),
      metrics: input.outcome.trim(),
      verifyUrl,
    }).catch(() => {
      // Email failure doesn't block the user — entry is saved, email can be retried
    })
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
