'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { badgeTier, emailOk, yearToStartDate, yearToEndDate, FIELD_MAX, FREE_PROJECT_LIMIT } from '@/lib/format'
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
    return { error: "You can't verify your own work - use someone else's email." }
  }

  // Proof/artifact is optional, but if one is supplied it must be a real URL -
  // the same check the client enforces, repeated here so it can't be bypassed.
  if (input.artifactUrl && !/^https?:\/\/.+\..+/i.test(input.artifactUrl.trim())) {
    return { error: 'Your proof link must be a valid URL starting with https://.' }
  }

  // Re-check the per-field length caps the client enforces with maxLength, so an
  // over-long value can't be slipped in past the input (e.g. a crafted request).
  const tooLong =
    input.title.trim().length > FIELD_MAX.title ||
    input.company.trim().length > FIELD_MAX.company ||
    input.description.trim().length > FIELD_MAX.description ||
    input.outcome.trim().length > FIELD_MAX.outcome ||
    input.vName.trim().length > FIELD_MAX.vName ||
    input.vRole.trim().length > FIELD_MAX.vRole ||
    input.vEmail.trim().length > FIELD_MAX.vEmail ||
    input.vLink.trim().length > FIELD_MAX.vLink ||
    input.vNote.trim().length > FIELD_MAX.vNote
  if (tooLong) {
    return { error: 'One of your entries is too long. Please shorten it and try again.' }
  }

  // Free accounts are capped at FREE_PROJECT_LIMIT projects; founding members are
  // unlimited. Enforced here (and by a DB trigger) so it can't be bypassed by
  // hitting the API directly. This is what stops a 4th free project.
  const { data: profile } = await supabase
    .from('users')
    .select('premium')
    .eq('id', user.id)
    .single()
  if (!profile?.premium) {
    const { count } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= FREE_PROJECT_LIMIT) {
      return { error: `Free accounts can hold up to ${FREE_PROJECT_LIMIT} projects. Become a founding member for unlimited projects.` }
    }
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

  // Generate the verification token here so we never have to read it back out
  // of the database - that column is no longer exposed to the API role.
  const token = crypto.randomUUID()
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
    token,
  })

  if (valErr) {
    await supabase.from('entries').delete().eq('id', entry.id)
    return { error: "We couldn't save the validator details. Please try again." }
  }

  {
    const hdrs = await headers()
    const host = hdrs.get('host') ?? 'localhost:3000'
    const proto = host.startsWith('localhost') ? 'http' : 'https'
    const verifyUrl = `${proto}://${host}/verify/${token}`

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
    }).catch((err) => {
      // Email failure doesn't block the user - the entry is saved either way -
      // but log the real reason (almost always a Resend config issue: missing
      // RESEND_API_KEY or an unverified sender domain) so it's diagnosable.
      console.error('[verification email] send failed:', err)
    })
  }

  revalidatePath('/dashboard')
  return { ok: true }
}
