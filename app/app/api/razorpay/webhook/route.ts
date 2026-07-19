import { headers } from 'next/headers'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendUpgradeEmail } from '@/lib/email'

// crypto + service-role client need Node, not Edge.
export const runtime = 'nodejs'

/* Razorpay webhook. Registered in Razorpay Dashboard -> Settings -> Webhooks,
   pointing at https://verifiedwork.co/api/razorpay/webhook, subscribed to the
   payment_link.paid event, with the signing secret in RAZORPAY_WEBHOOK_SECRET.
   On a verified payment we flip that exact user to premium (server-side, via
   the service role) and send them a confirmation email. */
export async function POST(request: Request) {
  const raw = await request.text()
  const sig = (await headers()).get('x-razorpay-signature')

  if (!verifyWebhookSignature(raw, sig)) {
    return Response.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: {
    event?: string
    payload?: { payment_link?: { entity?: { notes?: { user_id?: string } } } }
  }
  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  if (body.event === 'payment_link.paid') {
    const userId = body.payload?.payment_link?.entity?.notes?.user_id
    if (userId) {
      const admin = createAdminClient()
      // Only flip rows that aren't premium yet, so a webhook retry can't send a
      // second confirmation email. The update returns the row iff it changed.
      const { data: updated, error } = await admin
        .from('users')
        .update({ premium: true, premium_since: new Date().toISOString() })
        .eq('id', userId)
        .eq('premium', false)
        .select('email, full_name')
        .maybeSingle()

      if (error) {
        console.error('[razorpay webhook] premium update failed:', error)
        // 500 so Razorpay retries rather than dropping the upgrade.
        return Response.json({ error: 'update failed' }, { status: 500 })
      }
      if (updated?.email) {
        await sendUpgradeEmail({ to: updated.email, name: updated.full_name ?? '' }).catch(
          (e) => console.error('[razorpay webhook] upgrade email failed:', e),
        )
      }
    }
  }

  // Always 200 for handled/ignored events so Razorpay stops retrying.
  return Response.json({ ok: true }, { status: 200 })
}
