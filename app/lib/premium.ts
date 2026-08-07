import { createAdminClient } from '@/lib/supabase/admin'
import { sendUpgradeEmail } from '@/lib/email'

export type Receipt = {
  receipt_number: string
  created_at: string
  amount: number | null
  currency: string | null
  razorpay_payment_id: string | null
}

/* The one place membership is ever granted. Both payment paths - the
   post-payment callback and the webhook backstop - funnel through here so they
   can race, retry, or both fire without double-granting or sending two emails.

   Two independent idempotency guards, because the two effects have different
   natural keys:
   - `users.premium` is only updated where it is still false, so the flag and
     premium_since settle once.
   - the receipt row is keyed on user_id, so the *first* writer wins and the
     confirmation email hangs off that insert. Keying the email on the receipt
     rather than the flag means a user whose premium was set by hand (a support
     backfill) still gets a proper receipt when their payment record lands. */
export async function grantFoundingMember(opts: {
  userId: string
  paymentId?: string | null
  paymentLinkId?: string | null
  amount?: number | null
  currency?: string | null
  via: 'callback' | 'webhook'
}): Promise<{ granted: boolean; receipt: Receipt | null }> {
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
  // never cost someone the membership they paid for. `ignoreDuplicates` means a
  // second grant for the same user returns no row, which is precisely the
  // signal that the receipt was already issued.
  let receipt: Receipt | null = null
  let receiptWorked = true
  const { data: inserted, error: receiptError } = await admin
    .from('founding_members')
    .upsert(
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
    .select('receipt_number, created_at, amount, currency, razorpay_payment_id')
    .maybeSingle()

  if (receiptError) {
    receiptWorked = false
    console.error('[premium] founding_members receipt write failed:', receiptError)
  } else {
    receipt = inserted as Receipt | null
  }

  // Send once per membership. Normally that means "when the receipt was just
  // issued"; if the receipt table is unreachable we fall back to the flag flip
  // so the buyer still hears from us, just without a receipt number.
  const shouldEmail = receiptWorked ? !!receipt : !!updated

  // The conditional update returns the row only when it changed one, so an
  // account that was already premium gives us no address - look it up.
  let recipient = updated
  if (shouldEmail && !recipient) {
    const { data } = await admin
      .from('users')
      .select('email, full_name')
      .eq('id', opts.userId)
      .maybeSingle()
    recipient = data
  }

  if (shouldEmail && recipient?.email) {
    const sent = await sendUpgradeEmail({
      to: recipient.email,
      name: recipient.full_name ?? '',
      receipt,
    })
      .then(() => true)
      .catch((e) => {
        console.error('[premium] upgrade email failed:', e)
        return false
      })

    if (sent && receipt) {
      const { error: stampError } = await admin
        .from('founding_members')
        .update({ receipt_email_sent_at: new Date().toISOString() })
        .eq('user_id', opts.userId)
      if (stampError) console.error('[premium] receipt stamp failed:', stampError)
    }
  }

  return { granted: !!updated, receipt }
}
