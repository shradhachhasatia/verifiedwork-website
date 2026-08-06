import { createAdminClient } from '@/lib/supabase/admin'
import { sendUpgradeEmail } from '@/lib/email'

/* The one place membership is ever granted. Both payment paths - the
   post-payment callback and the webhook backstop - funnel through here so they
   can race, retry, or both fire without double-granting or sending two emails.

   Idempotency comes from the conditional update: only rows that are still
   `premium = false` are touched, and the update returns a row only when it
   actually changed one. Everything that should happen once (the email) hangs off
   that return value. */
export async function grantFoundingMember(opts: {
  userId: string
  paymentId?: string | null
  paymentLinkId?: string | null
  amount?: number | null
  currency?: string | null
  via: 'callback' | 'webhook'
}): Promise<{ granted: boolean }> {
  const admin = createAdminClient()

  const { data: updated, error } = await admin
    .from('users')
    .update({ premium: true, premium_since: new Date().toISOString() })
    .eq('id', opts.userId)
    .eq('premium', false)
    .select('email, full_name')
    .maybeSingle()

  // Thrown, not swallowed: the caller decides whether to 500 (webhook, so
  // Razorpay retries) or redirect to a "still activating" state (callback).
  if (error) throw new Error(`premium update failed: ${error.message}`)

  // Best-effort receipt. Migrations in this repo are applied by hand, so this
  // table may not exist yet on a fresh deploy - and a missing audit row must
  // never cost someone the membership they just paid for.
  const { error: receiptError } = await admin.from('founding_members').upsert(
    {
      user_id: opts.userId,
      razorpay_payment_id: opts.paymentId ?? null,
      razorpay_payment_link_id: opts.paymentLinkId ?? null,
      amount: opts.amount ?? null,
      currency: opts.currency ?? null,
      granted_via: opts.via,
    },
    { onConflict: 'user_id', ignoreDuplicates: true },
  )
  if (receiptError) {
    console.error('[premium] founding_members receipt write failed:', receiptError)
  }

  if (updated?.email) {
    await sendUpgradeEmail({ to: updated.email, name: updated.full_name ?? '' }).catch((e) =>
      console.error('[premium] upgrade email failed:', e),
    )
  }

  return { granted: !!updated }
}
