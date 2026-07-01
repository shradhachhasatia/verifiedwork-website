'use client'

import { useState } from 'react'
import { Icon, CheckDot } from '@/components/Icon'
import { submitFeedback } from './actions'

const CATEGORIES = ['Idea', 'Bug', 'Praise', 'Other'] as const
const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

export default function FeedbackForm({
  initialEmail,
  loggedIn,
}: {
  initialEmail: string
  loggedIn: boolean
}) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Idea')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const emailErr = !loggedIn && !!email.trim() && !emailOk(email)

  async function submit() {
    if (!message.trim() || emailErr) return
    setSubmitting(true)
    setError('')
    const result = await submitFeedback({ category, message, email })
    setSubmitting(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="screen">
        <div className="auth wrap wrap-sm">
          <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 8 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="inbox" size={28} color="var(--black)" />
            </div>
            <span style={{ position: 'absolute', bottom: -6, right: -6 }}><CheckDot size={26} /></span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,32px)' }}>Thank you.</h1>
          <p className="auth-sub">Your feedback is on its way to the team. We read every message.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="wrap wrap-sm" style={{ paddingTop: 'clamp(28px,5vw,52px)', paddingBottom: 48 }}>
        <span className="eyebrow">We&apos;re listening</span>
        <h1 className="h1" style={{ marginTop: 12, fontSize: 'clamp(24px,3vw,34px)', marginBottom: 8 }}>Share feedback</h1>
        <p className="lede" style={{ marginBottom: 24 }}>
          Found a bug, have an idea, or just want to say hi? Tell us - it goes straight to the team.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="field">
            <label className="field-lbl">Type</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value as (typeof CATEGORIES)[number])}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-lbl">Your feedback</label>
            <textarea
              className="input"
              style={{ minHeight: 160, paddingTop: 12, paddingBottom: 12, resize: 'vertical', lineHeight: 1.5 }}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              autoFocus
            />
          </div>

          {!loggedIn && (
            <div className="field">
              <label className="field-lbl">Your email <span className="muted" style={{ fontWeight: 400 }}>· optional, so we can reply</span></label>
              <input
                className={'input' + (emailErr ? ' err' : '')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
              {emailErr && <span className="field-err">That email doesn&apos;t look right.</span>}
            </div>
          )}

          {error && <span className="field-err">{error}</span>}

          <button className="btn btn-primary block pill" disabled={!message.trim() || emailErr || submitting} onClick={submit}>
            {submitting ? <><span className="btn-spin" /> Sending…</> : 'Send feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
