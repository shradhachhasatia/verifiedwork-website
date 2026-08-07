import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import {
  configuredPrice,
  fetchPayment,
  parseReferenceId,
  verifyPaymentLinkSignature,
} from '@/lib/razorpay'
import { grantFoundingMember } from '@/lib/premium'

// crypto + service-role client need Node, not Edge.
export const runtime = 'nodejs'

/* Where Razorpay sends the user after they pay. This - not the webhook - is now
   the primary way membership is granted: it needs no dashboard configuration and
   no RAZORPAY_WEBHOOK_SECRET, both of which are manual steps that were silently
   missing, leaving people who had genuinely paid stuck on the free plan.

   The user is identified from `razorpay_payment_link_reference_id`, which is
   covered by the signature, so a forged or replayed URL can't upgrade an account.
   Deliberately does not consult the session: this route is reached mid-redirect
   from another origin, and trusting "whoever is logged in here" would let a
   replayed callback URL upgrade the wrong person. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  // Build the origin from the Host header, the same way /upgrade does. Not
  // nextUrl.origin: that comes from the server's own config rather than the
  // request, so behind Vercel's proxy it can resolve to localhost - which would
  // strand a user who just paid on a dead URL.
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'verifiedwork.co'
  const origin = `${host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'}://${host}`

  const paymentId = sp.get('razorpay_payment_id')
  const paymentLinkId = sp.get('razorpay_payment_link_id')
  const referenceId = sp.get('razorpay_payment_link_reference_id')
  const status = sp.get('razorpay_payment_link_status')
  const signature = sp.get('razorpay_signature')

  // Anything short of a verified, paid paylink lands on "activating" rather than
  // a celebration - never claim a payment succeeded on unverified input.
  const pending = NextResponse.redirect(`${origin}/dashboard?upgrade_pending=1`)

  if (!paymentId || !paymentLinkId || !referenceId || !status || !signature) {
    console.error('[razorpay callback] missing callback params')
    return pending
  }
  if (!verifyPaymentLinkSignature({ paymentLinkId, referenceId, status, paymentId, signature })) {
    console.error('[razorpay callback] signature verification failed', { paymentLinkId, status })
    return pending
  }
  if (status !== 'paid') {
    console.error('[razorpay callback] payment link not paid:', status)
    return pending
  }

  // Links minted before reference_id was added carry none, so there is no proven
  // user id to act on. The webhook (or a manual backfill) covers those instead of
  // us guessing.
  const userId = parseReferenceId(referenceId)
  if (!userId) {
    console.error('[razorpay callback] no user id in reference:', referenceId)
    return pending
  }

  // What was actually charged, for the receipt. Falls back to the configured
  // price if Razorpay is unreachable - a receipt with a best-known amount beats
  // holding up a membership that has already been paid for.
  const charged = (await fetchPayment(paymentId)) ?? configuredPrice()

  try {
    await grantFoundingMember({
      userId,
      paymentId,
      paymentLinkId,
      amount: charged.amount,
      currency: charged.currency,
      via: 'callback',
    })
  } catch (e) {
    console.error('[razorpay callback] grant failed:', e)
    return pending
  }

  return NextResponse.redirect(`${origin}/dashboard?upgraded=1`)
}
