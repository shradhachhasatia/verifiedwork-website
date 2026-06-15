'use client'

import { useState } from 'react'
import { submitVerification } from './actions'
import { Wordmark, CheckDot } from '@/components/Icon'

type Request = {
  validator_name: string
  owner_name: string
  role_title: string
  company: string
  work_done: string
  metrics: string
  contribution: string | null
  start_date: string | null
  end_date: string | null
}

const CONTRIB_OPTIONS = [
  { value: 'owner', label: 'Owner', desc: 'Led this end-to-end' },
  { value: 'partner', label: 'Partner', desc: 'Co-led or co-built' },
  { value: 'executor', label: 'Executor', desc: 'Key contributor to the team' },
]
const ACCURACY_OPTIONS = [
  { value: 'accurate', label: 'Yes, accurate' },
  { value: 'mostly', label: 'Mostly accurate' },
  { value: 'no', label: 'Not accurate' },
]
const REHIRE_OPTIONS = [
  { value: 'definitely', label: 'Definitely' },
  { value: 'probably', label: 'Probably' },
  { value: 'no', label: 'No' },
]

function Pills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; desc?: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="pills">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          className={'pill' + (value === o.value ? ' sel' : '')}
          onClick={() => onChange(o.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start', minHeight: o.desc ? 58 : 46 }}
        >
          <span>{o.label}</span>
          {o.desc && <span style={{ fontWeight: 400, fontSize: 12, color: value === o.value ? 'rgba(255,255,255,.8)' : 'var(--grey)' }}>{o.desc}</span>}
        </button>
      ))}
    </div>
  )
}

export default function VerifyForm({ token, req }: { token: string; req: Request }) {
  const ownerFirst = req.owner_name.split(' ')[0]

  const [contribution, setContribution] = useState('')
  const [outcomeAcc, setOutcomeAcc] = useState('')
  const [sentence, setSentence] = useState('')
  const [rehire, setRehire] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const canSubmit = contribution && outcomeAcc && sentence.trim().length >= 10 && rehire

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    const result = await submitVerification(token, { contribution, outcomeAcc, sentence: sentence.trim(), rehire })
    setSubmitting(false)
    if ('error' in result) { setError(result.error); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="auth" style={{ minHeight: '100vh' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--green-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <CheckDot size={28} />
        </div>
        <h1 className="h1" style={{ fontSize: 'clamp(26px,3vw,36px)', marginBottom: 12 }}>Verification submitted</h1>
        <p className="lede" style={{ maxWidth: '34ch', textAlign: 'center' }}>
          Thanks for taking the time. {ownerFirst}&apos;s profile has been stamped as verified.
        </p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-head">
        <div className="inner"><Wordmark /></div>
      </header>

      <div className="screen">
        <div className="wrap wrap-sm" style={{ paddingTop: 'clamp(28px,5vw,48px)', paddingBottom: 48 }}>
          <span className="eyebrow">Verification request</span>
          <h1 className="h1" style={{ marginTop: 14, fontSize: 'clamp(24px,3vw,34px)' }}>
            Verify {ownerFirst}&apos;s work
          </h1>
          <p className="lede" style={{ marginTop: 10, marginBottom: 28 }}>
            {req.owner_name} listed you as someone who can speak to their work. It takes about a minute.
          </p>

          {/* Work summary */}
          <div className="card card-pad" style={{ marginBottom: 28 }}>
            <div className="receipt-row" style={{ borderTop: 0, paddingTop: 0 }}>
              <span className="k">Role</span>
              <span className="v">{req.role_title} · {req.company}</span>
            </div>
            <div className="receipt-row">
              <span className="k">What they did</span>
              <span className="v" style={{ textAlign: 'right', maxWidth: '60%', fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}>{req.work_done}</span>
            </div>
            <div className="receipt-row">
              <span className="k">Outcome</span>
              <span className="v" style={{ textAlign: 'right', maxWidth: '60%', fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}>{req.metrics}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div className="field">
              <label className="field-lbl">How would you describe {ownerFirst}&apos;s contribution?</label>
              <Pills options={CONTRIB_OPTIONS} value={contribution} onChange={setContribution} />
            </div>

            <div className="field">
              <label className="field-lbl">Does the outcome they described sound accurate?</label>
              <Pills options={ACCURACY_OPTIONS} value={outcomeAcc} onChange={setOutcomeAcc} />
            </div>

            <div className="field">
              <label className="field-lbl">Write a one-sentence endorsement</label>
              <textarea
                className="textarea"
                placeholder={`e.g. "${ownerFirst} shipped our entire auth system in 6 weeks and did it right."`}
                value={sentence}
                onChange={e => setSentence(e.target.value)}
                maxLength={240}
                rows={3}
              />
              <span className="helper">{sentence.length}/240 · min 10 characters</span>
            </div>

            <div className="field">
              <label className="field-lbl">Would you work with {ownerFirst} again?</label>
              <Pills options={REHIRE_OPTIONS} value={rehire} onChange={setRehire} />
            </div>

            {error && (
              <div className="auth-alert" style={{ margin: 0 }}>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg block pill"
              disabled={!canSubmit || submitting}
            >
              {submitting ? <><span className="btn-spin" /> Submitting…</> : 'Submit verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
