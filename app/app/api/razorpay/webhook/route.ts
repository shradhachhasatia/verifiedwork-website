import { headers } from 'next/headers'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { grantFoundingMember } from '@/lib/premium'

// crypto + service-role client need Node, not Edge.
export const runtime = 'nodejs'

/* Razorpay webhook. Registered in Razorpay Dashboard -> Settings -> Webhooks,
   pointing at https://verifiedwork.co/api/razorpay/webhook, subscribed to the
   payment_link.paid event, with the signing secret in RAZORPAY_WEBHOOK_SECRET.

   This is now the *backstop*, not the primary path: /api/razorpay/callback
   grants membership when the user is redirected back, which needs none of the
   manual setup above. This still matters for anyone who closes the tab before
   the redirect completes. Both routes share grantFoundingMember, so whichever
   arrives second is a no-op. */
export async function POST(request: Request) {
  const raw = await request.text()
  const sig = (await headers()).get('x-razorpay-signature')

  if (!verifyWebhookSignature(raw, sig)) {
    return Response.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: {
    event?: string
    payload?: {
      payment_link?: {
        entity?: {
          id?: string
          amount?: number
          currency?: string
          notes?: { user_id?: string }
        }
      }
      payment?: { entity?: { id?: string } }
    }
  }
  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  if (body.event === 'payment_link.paid') {
    const link = body.payload?.payment_link?.entity
    const userId = link?.notes?.user_id
    if (userId) {
      try {
        await grantFoundingMember({
          userId,
          paymentId: body.payload?.payment?.entity?.id ?? null,
          paymentLinkId: link?.id ?? null,
          amount: link?.amount ?? null,
          currency: link?.currency ?? null,
          via: 'webhook',
        })
      } catch (e) {
        console.error('[razorpay webhook] grant failed:', e)
        // 500 so Razorpay retries rather than dropping the upgrade.
        return Response.json({ error: 'update failed' }, { status: 500 })
      }
    }
  }

  // Always 200 for handled/ignored events so Razorpay stops retrying.
  return Response.json({ ok: true }, { status: 200 })
}
