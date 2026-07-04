'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckDot } from '@/components/Icon'

/* Mirrors the real validator flow in app/app/verify/[token]/VerifyForm.tsx */
const CONTRIB = [
  { value: 'owner', label: 'Owner', desc: 'Led this end-to-end' },
  { value: 'partner', label: 'Partner', desc: 'Co-led or co-built' },
  { value: 'executor', label: 'Executor', desc: 'Key contributor to the team' },
]
const ACCURACY = [
  { value: 'accurate', label: 'Yes, accurate' },
  { value: 'mostly', label: 'Mostly accurate' },
  { value: 'no', label: 'Not accurate' },
]
const REHIRE = [
  { value: 'definitely', label: 'Definitely' },
  { value: 'probably', label: 'Probably' },
  { value: 'no', label: 'No' },
]

const REQ = {
  owner: 'Alex Rivera',
  ownerFirst: 'Alex',
  validator: 'Priya Mehta',
  validatorRole: 'Design Lead',
  role: 'Product Designer',
  company: 'Bloom Agency',
  work: 'Redesigned the onboarding flow end-to-end — research, prototypes and the shipped build.',
  metrics: 'Cut sign-up drop-off by 18%.',
}
const FULL_ENDORSEMENT = 'Alex owned our onboarding redesign start to finish and the drop-off numbers were real.'
const STEPS = ['The request email', 'The verify screen', 'Verified', 'Their profile updates']
const URLS = ['inbox · mail', 'verified.work/verify/9f2a…', 'verified.work/verify/9f2a…', 'verified.work/alexrivera']

function Pills({ options, value, onChange }: {
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

const Lock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
)

export default function DemoView() {
  const [step, setStep] = useState(0)
  const [contribution, setContribution] = useState('')
  const [accuracy, setAccuracy] = useState('')
  const [endorsement, setEndorsement] = useState('')
  const [rehire, setRehire] = useState('')
  const [playing, setPlaying] = useState(false)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const typer = useRef<ReturnType<typeof setInterval> | null>(null)

  function clearAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (typer.current) { clearInterval(typer.current); typer.current = null }
  }
  function reset() {
    setContribution(''); setAccuracy(''); setEndorsement(''); setRehire('')
  }
  function stop() { clearAll(); setPlaying(false) }

  function typeEndorsement(text: string) {
    let i = 0
    setEndorsement('')
    typer.current = setInterval(() => {
      i++
      setEndorsement(text.slice(0, i))
      if (i >= text.length && typer.current) { clearInterval(typer.current); typer.current = null }
    }, 26)
  }

  function play() {
    clearAll(); reset(); setStep(0); setPlaying(true)
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))
    at(750, () => setStep(1))
    at(1500, () => setContribution('owner'))
    at(2150, () => setAccuracy('accurate'))
    at(2700, () => typeEndorsement(FULL_ENDORSEMENT))
    at(4650, () => setRehire('definitely'))
    at(5300, () => setStep(2))
    at(6900, () => setStep(3))
    at(7100, () => setPlaying(false))
  }

  // Autoplay once on mount (static for reduced-motion users).
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setContribution('owner'); setAccuracy('accurate'); setEndorsement(FULL_ENDORSEMENT); setRehire('definitely')
    } else {
      const t = setTimeout(play, 500)
      return () => { clearTimeout(t); clearAll() }
    }
    return () => clearAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goto = (n: number) => { stop(); setStep(Math.max(0, Math.min(STEPS.length - 1, n))) }
  // Manual interaction during autoplay cancels it.
  const pick = (setter: (v: string) => void) => (v: string) => { if (playing) stop(); setter(v) }

  return (
    <div className="screen">
      <div className="wrap wrap-lg" style={{ paddingTop: 'clamp(24px,4vw,44px)', paddingBottom: 56 }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(26px,4vw,42px)' }}>
          <span className="eyebrow">Interactive demo</span>
          <h1 className="h1" style={{ marginTop: 12, fontSize: 'clamp(26px,3.2vw,40px)' }}>See how your work gets verified</h1>
          <p className="lede" style={{ maxWidth: '52ch', margin: '12px auto 0' }}>
            No account needed for the person who vouches for you. Here&apos;s the whole thing, from their side — click through it, or watch it play.
          </p>
        </div>

        <div className="demo-wrap">
          <div className="dbrowser">
            <div className="dbrowser-bar">
              <span className="bdots"><i /><i /><i /></span>
              <span className="dbrowser-url"><Lock /><span>{URLS[step]}</span></span>
            </div>
            <div className="dbrowser-body">
              <div key={step} className="dfade">
                {step === 0 && <StepEmail onVerify={() => goto(1)} />}
                {step === 1 && (
                  <StepVerify
                    contribution={contribution} setContribution={pick(setContribution)}
                    accuracy={accuracy} setAccuracy={pick(setAccuracy)}
                    endorsement={endorsement} setEndorsement={(v) => { if (playing) stop(); setEndorsement(v) }}
                    rehire={rehire} setRehire={pick(setRehire)}
                    onSubmit={() => goto(2)}
                  />
                )}
                {step === 2 && <StepStamp onNext={() => goto(3)} />}
                {step === 3 && <StepProfile />}
              </div>
            </div>
          </div>

          {/* controls */}
          <div className="dctrl">
            <button className="dnav-btn" onClick={() => goto(step - 1)} disabled={step === 0} aria-label="Previous step">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className="ddots">
              {STEPS.map((s, i) => (
                <button key={s} className={'ddot' + (i === step ? ' on' : '')} onClick={() => goto(i)} aria-label={s} />
              ))}
            </div>
            <button className="dnav-btn" onClick={() => goto(step + 1)} disabled={step === STEPS.length - 1} aria-label="Next step">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
            <span className="dstep-label lblf">{step + 1}/{STEPS.length} · {STEPS[step]}</span>
            <button className="btn btn-secondary btn-sm pill" onClick={play}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              {playing ? 'Playing…' : 'Play walkthrough'}
            </button>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: 'clamp(40px,6vw,72px)' }}>
            <h2 className="h2" style={{ fontSize: 'clamp(22px,2.4vw,32px)' }}>Your turn.</h2>
            <p className="lede" style={{ margin: '10px auto 22px', maxWidth: '40ch' }}>Build your own verified profile and send your first request in minutes.</p>
            <Link href="/login" className="btn btn-primary btn-lg pill">
              Create your profile — free
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard() {
  return (
    <div className="card card-pad">
      <div className="receipt-row" style={{ borderTop: 0, paddingTop: 0 }}>
        <span className="k">Role</span><span className="v">{REQ.role} · {REQ.company}</span>
      </div>
      <div className="receipt-row">
        <span className="k">What they did</span>
        <span className="v" style={{ textAlign: 'right', maxWidth: '62%', fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}>{REQ.work}</span>
      </div>
      <div className="receipt-row">
        <span className="k">Outcome</span>
        <span className="v" style={{ textAlign: 'right', maxWidth: '62%', fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}>{REQ.metrics}</span>
      </div>
    </div>
  )
}

function StepEmail({ onVerify }: { onVerify: () => void }) {
  return (
    <div className="demail">
      <div className="demail-head">
        <span className="demail-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 6 10 7 10-7" /></svg>
        </span>
        <div className="demail-from">
          <div className="n">verified.work</div>
          <div className="e">admin@verifiedwork.co · to you</div>
        </div>
      </div>
      <h2 className="demail-subject">{REQ.ownerFirst} wants you to verify their work at {REQ.company}</h2>
      <p className="demail-hi">Hi {REQ.validator.split(' ')[0]}, {REQ.owner} listed you as someone who can speak to their work. It takes about a minute.</p>
      <SummaryCard />
      <button className="btn btn-primary btn-lg block pill" style={{ marginTop: 22 }} onClick={onVerify}>
        Verify their work
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
      </button>
    </div>
  )
}

function StepVerify({
  contribution, setContribution, accuracy, setAccuracy, endorsement, setEndorsement, rehire, setRehire, onSubmit,
}: {
  contribution: string; setContribution: (v: string) => void
  accuracy: string; setAccuracy: (v: string) => void
  endorsement: string; setEndorsement: (v: string) => void
  rehire: string; setRehire: (v: string) => void
  onSubmit: () => void
}) {
  const canSubmit = contribution && accuracy && endorsement.trim().length >= 10 && rehire
  return (
    <div className="wrap wrap-sm" style={{ padding: 0 }}>
      <span className="eyebrow">Verification request</span>
      <h2 className="h2" style={{ marginTop: 10, fontSize: 'clamp(22px,2.4vw,30px)' }}>Verify {REQ.ownerFirst}&apos;s work</h2>
      <p className="lede" style={{ marginTop: 8, marginBottom: 24, fontSize: 16 }}>{REQ.owner} listed you as someone who can speak to their work.</p>
      <div style={{ marginBottom: 24 }}><SummaryCard /></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div className="field">
          <label className="field-lbl">How would you describe {REQ.ownerFirst}&apos;s contribution?</label>
          <Pills options={CONTRIB} value={contribution} onChange={setContribution} />
        </div>
        <div className="field">
          <label className="field-lbl">Does the outcome they described sound accurate?</label>
          <Pills options={ACCURACY} value={accuracy} onChange={setAccuracy} />
        </div>
        <div className="field">
          <label className="field-lbl">Write a one-sentence endorsement</label>
          <textarea className="textarea" rows={3} maxLength={240} value={endorsement} onChange={e => setEndorsement(e.target.value)} placeholder={`e.g. "${REQ.ownerFirst} shipped it and did it right."`} />
          <span className="helper">{endorsement.length}/240 · min 10 characters</span>
        </div>
        <div className="field">
          <label className="field-lbl">Would you work with {REQ.ownerFirst} again?</label>
          <Pills options={REHIRE} value={rehire} onChange={setRehire} />
        </div>
        <button className="btn btn-primary btn-lg block pill" disabled={!canSubmit} onClick={onSubmit}>Submit verification</button>
      </div>
    </div>
  )
}

function StepStamp({ onNext }: { onNext: () => void }) {
  return (
    <div className="dstamp-wrap">
      <svg className="dstamp" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" /><path d="M17 8.5 10.5 15.5 7 12" /></svg>
      <h2 className="h2" style={{ fontSize: 'clamp(22px,2.4vw,30px)' }}>Verification submitted</h2>
      <p className="lede" style={{ maxWidth: '34ch', margin: '10px auto 22px' }}>Thanks, Priya. {REQ.ownerFirst}&apos;s profile has been stamped as verified.</p>
      <button className="btn btn-secondary btn-sm pill" onClick={onNext}>
        See the updated profile
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
      </button>
    </div>
  )
}

function StepProfile() {
  return (
    <div className="wrap wrap-sm" style={{ padding: 0 }}>
      <div className="dprofile-head">
        <span className="avi" style={{ width: 56, height: 56, fontSize: 20, background: 'var(--black)' }}>AR</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.01em' }}>{REQ.owner}</span>
            <span className="status verified"><CheckDot size={13} /> Verified</span>
          </div>
          <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>{REQ.role} · {REQ.company}</div>
        </div>
      </div>

      <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h3 className="h3" style={{ fontSize: 17 }}>Redesigned onboarding for 40k users</h3>
          <span className="status verified"><CheckDot size={13} /> Verified</span>
        </div>
        <div className="quotebox"><span className="qm">&ldquo;</span><p>{FULL_ENDORSEMENT}</p></div>
        <div>
          <div className="receipt-row" style={{ borderTop: 0, paddingTop: 0 }}>
            <span className="k">Verified by</span><span className="v">{REQ.validator}, {REQ.validatorRole}</span>
          </div>
          <div className="receipt-row">
            <span className="k">Work again</span><span className="v" style={{ color: 'var(--green)' }}>Definitely</span>
          </div>
        </div>
      </div>
    </div>
  )
}
