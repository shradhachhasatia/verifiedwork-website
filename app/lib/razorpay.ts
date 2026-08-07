import { createHmac, timingSafeEqual } from 'crypto'

/* Razorpay integration via the REST API (no SDK dependency).
   Amount is in the currency's smallest unit (cents for USD, paise for INR).
   Defaults to $10 USD; override with RAZORPAY_AMOUNT / RAZORPAY_CURRENCY
   (e.g. an INR-only account would set CURRENCY=INR and AMOUNT=83000). */
const API = 'https://api.razorpay.com/v1'
const AMOUNT = Number(process.env.RAZORPAY_AMOUNT ?? '1000')
const CURRENCY = process.env.RAZORPAY_CURRENCY ?? 'USD'

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID ?? ''
  const secret = process.env.RAZORPAY_KEY_SECRET ?? ''
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64')
}

/* The user's id has to survive the round trip to Razorpay and back twice over,
   by two different routes:

   - `notes.user_id` comes back in the *webhook* payload.
   - `reference_id` comes back as a *query param* on the post-payment redirect,
     and - unlike notes - it is one of the four fields covered by the callback
     signature. That is what lets the callback trust it: the id is proven to
     belong to this payment, so we never have to guess from the browser session
     (a replayed callback URL would otherwise upgrade whoever is logged in).

   Razorpay requires reference_id to be unique per payment link, so a base36
   timestamp is appended - a user who abandons one link and starts another must
   not collide with themselves. */
export function buildReferenceId(userId: string): string {
  return `u_${userId}_${Date.now().toString(36)}`
}

export function parseReferenceId(reference: string | null | undefined): string | null {
  const m = /^u_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_/i.exec(
    reference ?? '',
  )
  return m ? m[1] : null
}

/* Create a per-user payment link. The user's id rides along in `notes` so the
   webhook can upgrade exactly the right account - the whole point of doing this
   in-app instead of one shared static link. */
export async function createUpgradePaymentLink(opts: {
  userId: string
  email: string
  name: string
  callbackUrl: string
}): Promise<{ url: string } | { error: string }> {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return { error: 'not_configured' }
  }
  try {
    const res = await fetch(`${API}/payment_links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
      body: JSON.stringify({
        amount: AMOUNT,
        currency: CURRENCY,
        accept_partial: false,
        description: 'verified.work - Founding member',
        customer: { email: opts.email, name: opts.name || undefined },
        notify: { email: true, sms: false },
        reminder_enable: false,
        notes: { user_id: opts.userId },
        reference_id: buildReferenceId(opts.userId),
        callback_url: opts.callbackUrl,
        callback_method: 'get',
      }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      short_url?: string
      error?: { description?: string }
    }
    if (!res.ok || !data.short_url) {
      return { error: data?.error?.description || 'create_failed' }
    }
    return { url: data.short_url }
  } catch {
    return { error: 'network' }
  }
}

/* What was actually charged, for the receipt. The post-payment redirect names
   the payment but not its amount, and a receipt that says "$10" because that is
   what the config default happens to be would be a receipt we cannot stand
   behind - so ask Razorpay. Best-effort: a failure here must never cost someone
   the membership they just paid for, so the caller falls back to the configured
   amount and the receipt still goes out. */
export async function fetchPayment(
  paymentId: string,
): Promise<{ amount: number; currency: string } | null> {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null
  try {
    // Bounded: this sits on the redirect path a paying user is waiting behind,
    // so a slow Razorpay costs them the configured amount on the receipt, never
    // a stalled page.
    const res = await fetch(`${API}/payments/${paymentId}`, {
      headers: { Authorization: authHeader() },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const d = (await res.json()) as { amount?: number; currency?: string }
    if (typeof d.amount !== 'number' || typeof d.currency !== 'string') return null
    return { amount: d.amount, currency: d.currency }
  } catch {
    return null
  }
}

/* The configured price, used as the receipt fallback when Razorpay can't be
   reached. Exported so callers don't re-read the env vars themselves. */
export function configuredPrice(): { amount: number; currency: string } {
  return { amount: AMOUNT, currency: CURRENCY }
}

/* Verify the X-Razorpay-Signature header: HMAC-SHA256 of the raw request body
   keyed by the webhook secret. Timing-safe compare. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  return compareHmac(rawBody, secret, signature)
}

/* Verify the params Razorpay appends to callback_url after payment. Different
   secret and different payload from the webhook above: this one is keyed by the
   API key secret (which we always have, unlike RAZORPAY_WEBHOOK_SECRET) over the
   four fields joined by "|", in this exact order. That independence is the point
   - the callback grant works even when the webhook was never configured. */
export function verifyPaymentLinkSignature(params: {
  paymentLinkId: string | null
  referenceId: string | null
  status: string | null
  paymentId: string | null
  signature: string | null
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  const { paymentLinkId, referenceId, status, paymentId, signature } = params
  if (!secret || !signature || !paymentLinkId || !referenceId || !status || !paymentId) {
    return false
  }
  const payload = `${paymentLinkId}|${referenceId}|${status}|${paymentId}`
  return compareHmac(payload, secret, signature)
}

function compareHmac(payload: string, secret: string, signature: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
