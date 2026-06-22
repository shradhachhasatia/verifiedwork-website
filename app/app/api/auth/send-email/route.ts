import { createHmac, timingSafeEqual } from 'crypto'
import { sendMagicLinkEmail } from '@/lib/email'

// @supabase/ssr / crypto need Node, not the Edge runtime.
export const runtime = 'nodejs'

/**
 * Supabase "Send Email" auth hook.
 * Supabase mints the sign-in token and POSTs it here (signed with the
 * Standard Webhooks scheme); we build the link and send the email through
 * Resend. Supabase's own mailer is never used — so no Supabase email rate
 * limit, and the token-hash link works on any device.
 *
 * Setup: Supabase → Authentication → Hooks → "Send Email" → enable as an
 * HTTPS hook pointing at https://<app>/api/auth/send-email, then copy the
 * generated secret into the SEND_EMAIL_HOOK_SECRET env var.
 */
function verifySignature(rawSecret: string, payload: string, headers: Headers): boolean {
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signatureHeader = headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  // Reject anything older than 5 minutes (replay protection).
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  // Secret arrives as "v1,whsec_<base64>"; the signing key is the base64 part.
  const secretBytes = Buffer.from(rawSecret.replace(/^v1,whsec_/, ''), 'base64')
  const expected = createHmac('sha256', secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest('base64')
  const expectedBuf = Buffer.from(expected)

  // Header is space-separated "v1,<sig>" entries.
  return signatureHeader.split(' ').some((part) => {
    const sig = part.split(',')[1]
    if (!sig) return false
    const sigBuf = Buffer.from(sig)
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)
  })
}

export async function POST(request: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET
  const payload = await request.text()

  if (!secret || !verifySignature(secret, payload, request.headers)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: {
    user?: { email?: string }
    email_data?: { token_hash?: string; redirect_to?: string; site_url?: string; email_action_type?: string }
  }
  try {
    body = JSON.parse(payload)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.user?.email
  const ed = body.email_data ?? {}
  if (!email || !ed.token_hash) {
    return Response.json({ error: 'Missing email data' }, { status: 400 })
  }

  // Build a token-hash link to our own callback, which verifies it server-side
  // (works on any device). redirect_to is the emailRedirectTo we passed at
  // sign-in (…/auth/callback); fall back to the site URL if it's absent.
  const base = ed.redirect_to || `${ed.site_url ?? ''}/auth/callback`
  let link: string
  try {
    const url = new URL(base)
    url.searchParams.set('token_hash', ed.token_hash)
    url.searchParams.set('type', ed.email_action_type || 'magiclink')
    link = url.toString()
  } catch {
    return Response.json({ error: 'Bad redirect URL' }, { status: 400 })
  }

  try {
    await sendMagicLinkEmail({ to: email, link })
  } catch {
    // Tell Supabase it failed so it can surface an error rather than think it sent.
    return Response.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return Response.json({}, { status: 200 })
}
