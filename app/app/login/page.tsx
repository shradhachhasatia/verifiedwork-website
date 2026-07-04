'use client'

import { useState } from 'react'
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

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

function GoogleConnecting() {
  return (
    <div className="modal-back">
      <div className="gmodal">
        <div className="gspin">
          <div className="g-logo"><GoogleG size={26} /></div>
          <div className="spinner" />
          <div>
            <div className="ttl">Connecting to Google…</div>
            <div className="sub">Verifying your account</div>
          </div>
        </div>
      </div>
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
  const [googleConnecting, setGoogleConnecting] = useState(false)
  const [sent, setSent] = useState(false)
  // Read the callback's ?error= once, at mount, instead of in an effect (which
  // triggers an extra render and is flagged by react-hooks lint).
  const [error, setError] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('error')
      ? "We couldn't finish signing you in - that link may have expired. Please request a new one."
      : ''
  })
  // New vs returning user. Auth is passwordless (the same OTP / Google call
  // handles both), so this only drives the copy - but it gives returning users
  // a clear "Sign in" instead of a signup-only screen.
  const [mode, setMode] = useState<'signup' | 'signin'>(() => {
    if (typeof window === 'undefined') return 'signup'
    return new URLSearchParams(window.location.search).get('mode') === 'signin' ? 'signin' : 'signup'
  })
  const isSignin = mode === 'signin'

  const ok = emailOk(email)
  const showFieldErr = touched && email.trim().length > 0 && !ok

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

  async function continueWithGoogle() {
    setGoogleConnecting(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    // On success the browser redirects to Google, so we only land here on error.
    if (error) {
      setGoogleConnecting(false)
      setError(friendlyAuthError(error))
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
      {googleConnecting && <GoogleConnecting />}
      <div className="auth wrap wrap-sm">
        <MarkIcon />

        <div className="auth-seg" role="tablist" aria-label="Sign up or sign in">
          <button role="tab" aria-selected={!isSignin} className={isSignin ? '' : 'on'} onClick={() => { setMode('signup'); setError('') }}>Sign up</button>
          <button role="tab" aria-selected={isSignin} className={isSignin ? 'on' : ''} onClick={() => { setMode('signin'); setError('') }}>Sign in</button>
        </div>

        <h1>{isSignin ? 'Welcome back' : 'Create your verified profile'}</h1>
        <p className="auth-sub">
          {isSignin
            ? 'Sign in to your verified.work profile.'
            : 'Showcase the work you actually did - endorsed by the people who were there.'}
        </p>

        <div className="auth-card">
          <button className="btn btn-google block" disabled={googleConnecting} onClick={continueWithGoogle}>
            <GoogleG size={18} /> Continue with Google
          </button>

          <div className="divider-or">or</div>

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
            {sending ? <><span className="btn-spin" /> Sending link…</> : isSignin ? 'Sign in with email' : 'Sign up with email'}
          </button>
        </div>

        {error && (
          <div className="auth-alert" role="alert">
            <InfoIcon /> <span>{error}</span>
          </div>
        )}

        <p className="auth-switch">
          {isSignin ? (
            <>New to verified.work?{' '}
              <button type="button" className="linklike" onClick={() => { setMode('signup'); setError('') }}>Create an account</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" className="linklike" onClick={() => { setMode('signin'); setError('') }}>Sign in</button>
            </>
          )}
        </p>

        <p className="auth-legal">
          By continuing you agree to our <a href="/terms.html">Terms</a> and{' '}
          <a href="/privacy.html">Privacy policy</a>. Any email works - no corporate address needed.
        </p>
      </div>
    </main>
  )
}
