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

/* Verify the X-Razorpay-Signature header: HMAC-SHA256 of the raw request body
   keyed by the webhook secret. Timing-safe compare. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
