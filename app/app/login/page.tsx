'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/* Same validation the mockup used - flags anything that isn't a real address. */
const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

/* ---------- icons (ported from the mockup) ---------- */
function MarkIcon() {
  return (
    <div className="auth-icon" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <path className="vp" d="M 12 30 L 31 77 L 50 53" />
        <path className="wp" d="M 50 53 L 69 77 L 88 23" />
      </svg>
    </div>
  )
}

function InfoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function InboxMark() {
  return (
    <div className="auth-icon" aria-hidden="true" style={{ animation: 'none', opacity: 1, transform: 'none' }}>
      <svg viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="48" fill="var(--green-tint)" />
        <g fill="none" stroke="var(--green)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M28 38h40v26a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4V38z" />
          <path d="M28 40l20 14 20-14" />
        </g>
      </svg>
    </div>
  )
}

/* Turn raw backend/auth errors into something a person can act on -
   we never surface the underlying message or status code to the user. */
function friendlyAuthError(error: { message?: string; status?: number } | null): string {
  const status = error?.status
  const msg = (error?.message || '').toLowerCase()

  if (status === 429 || msg.includes('rate') || msg.includes('too many') || msg.includes('security purposes')) {
    return 'Too many attempts just now. Please wait a minute and try again.'
  }
  if (msg.includes('invalid') && msg.includes('email')) {
    return "That email address doesn't look right. Please check it and try again."
  }
  if (msg.includes('signups not allowed') || msg.includes('not allowed') || msg.includes('disabled')) {
    return "We couldn't sign you in with that email. Try a different one or contact support."
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to')) {
    return 'Network hiccup - check your connection and try again.'
  }
  return 'Something went wrong on our end. Please try again in a moment.'
}

function getInboxUrl(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'https://mail.google.com'
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'https://outlook.live.com'
  if (domain === 'yahoo.com' || domain === 'ymail.com') return 'https://mail.yahoo.com'
  if (['icloud.com', 'me.com', 'mac.com'].includes(domain)) return 'https://www.icloud.com/mail'
  if (domain === 'protonmail.com' || domain === 'proton.me') return 'https://mail.proton.me'
  return ''
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const ok = emailOk(email)
  const showFieldErr = touched && email.trim().length > 0 && !ok

  // Surface a friendly message if the auth callback bounced us back with ?error=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setError("We couldn't finish signing you in - that link may have expired. Please request a new one.")
    }
  }, [])

  async function sendMagicLink() {
    if (!ok) {
      setTouched(true)
      return
    }
    setSending(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setSending(false)
    if (error) {
      setError(friendlyAuthError(error))
    } else {
      setSent(true)
    }
  }

  /* ---------- "check your inbox" ---------- */
  if (sent) {
    const inboxUrl = getInboxUrl(email.trim())
    return (
      <main className="app-main">
        <div className="auth wrap wrap-sm">
          <InboxMark />
          <h1>Check your inbox</h1>
          <p className="auth-sub">
            We sent a magic link to <strong style={{ color: 'var(--black)', fontWeight: 600 }}>{email.trim()}</strong>.
            Click it to finish signing in.
          </p>
          <div className="auth-card">
            {inboxUrl && (
              <a
                href={inboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary block"
              >
                Open inbox
              </a>
            )}
            <button className="btn btn-secondary block" disabled={sending} onClick={sendMagicLink}>
              {sending ? <><span className="btn-spin" style={{ borderColor: 'rgba(0,0,0,.15)', borderTopColor: 'var(--green)' }} /> Resending…</> : 'Resend link'}
            </button>
            <button
              className="btn btn-ghost block"
              onClick={() => { setSent(false); setError(''); setTouched(false) }}
            >
              Use a different email
            </button>
          </div>
          {error && (
            <div className="auth-alert" role="alert">
              <InfoIcon /> <span>{error}</span>
            </div>
          )}
        </div>
      </main>
    )
  }

  /* ---------- sign in / sign up ---------- */
  return (
    <main className="app-main">
      <div className="auth wrap wrap-sm">
        <MarkIcon />
        <h1>Create your verified profile</h1>
        <p className="auth-sub">
          Showcase the work you actually did - endorsed by the people who were there.
        </p>

        <div className="auth-card">
          <input
            className={'input' + (showFieldErr ? ' err' : '')}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@anything.com"
            value={email}
            aria-invalid={showFieldErr}
            disabled={sending}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={e => { if (e.key === 'Enter') sendMagicLink() }}
          />

          {showFieldErr && (
            <span className="field-err">Please enter a valid email address.</span>
          )}

          <button className="btn btn-primary block" disabled={!ok || sending} onClick={sendMagicLink}>
            {sending ? <><span className="btn-spin" /> Sending link…</> : 'Continue with email'}
          </button>
        </div>

        {error && (
          <div className="auth-alert" role="alert">
            <InfoIcon /> <span>{error}</span>
          </div>
        )}

        <p className="auth-legal">
          By continuing you agree to our <a href="/terms.html">Terms</a> and{' '}
          <a href="/privacy.html">Privacy policy</a>. Any email works - no corporate address needed.
        </p>
      </div>
    </main>
  )
}
