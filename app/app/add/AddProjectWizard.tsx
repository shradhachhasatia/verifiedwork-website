'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createUploadUrl } from '@/lib/storage-actions'
import { Icon, CheckDot } from '@/components/Icon'
import {
  YEARS, REL_OPTIONS, emailOk, badgeTier, periodLabel, durationLabel,
} from '@/lib/format'
import { createEntry } from './actions'

type Artifact = { type: 'link' | 'image' | 'file'; value: string; name: string; file?: File }

function WizBar({ current, total, label, onBack }: { current: number; total: number; label: string; onBack: () => void }) {
  return (
    <div className="wiz">
      <div className="wiz-top">
        <button className="wiz-back" onClick={onBack} aria-label="Back"><Icon name="arrowLeft" size={16} /></button>
        <div className="wiz-bar"><i style={{ width: (current / total * 100) + '%' }} /></div>
        <span className="wiz-step">{current}/{total}</span>
      </div>
      <h1 className="h2" style={{ marginTop: 16, fontSize: 'clamp(22px,2vw,30px)' }}>{label}</h1>
    </div>
  )
}

const urlOk = (v: string) => /^https?:\/\/.+\..+/i.test(v.trim())
const DESC_MAX = 600
const OUTCOME_MAX = 300

function ArtifactInput({ value, onChange }: { value: Artifact | null; onChange: (a: Artifact | null) => void }) {
  const [type, setType] = useState<'link' | 'image' | 'file'>(value ? value.type : 'link')
  const [link, setLink] = useState(value && value.type === 'link' ? value.value : '')
  const [linkErr, setLinkErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const tabs = [
    { k: 'link' as const, l: 'Link', i: 'link' as const },
    { k: 'image' as const, l: 'Image', i: 'image' as const },
    { k: 'file' as const, l: 'File', i: 'paperclip' as const },
  ]
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    onChange({ type: f.type.startsWith('image/') ? 'image' : 'file', value: URL.createObjectURL(f), name: f.name, file: f })
  }
  function attachLink() {
    const v = link.trim()
    if (!v) return
    if (!urlOk(v)) { setLinkErr('Must be a valid URL starting with https://'); return }
    setLinkErr('')
    onChange({ type: 'link', value: v, name: v })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="atabs">
        {tabs.map(t => (
          <button key={t.k} type="button" className={'atab' + (type === t.k ? ' sel' : '')} onClick={() => setType(t.k)}>
            <Icon name={t.i} size={15} />{t.l}
          </button>
        ))}
      </div>
      {value ? (
        <div className="art-prev">
          {value.type === 'image'
            ? <img src={value.value} alt="" />
            : <span className="ic"><Icon name={value.type === 'link' ? 'link' : 'fileText'} size={20} /></span>}
          <span className="nm">{value.name || value.value}</span>
          <button className="rm" type="button" onClick={() => { onChange(null); setLink(''); setLinkErr('') }} aria-label="Remove"><Icon name="x" size={15} /></button>
        </div>
      ) : type === 'link' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className={'input' + (linkErr ? ' err' : '')} placeholder="https://your-work.com/case-study" value={link} onChange={e => { setLink(e.target.value); if (linkErr) setLinkErr('') }} onKeyDown={e => e.key === 'Enter' && attachLink()} />
            <button className="btn btn-secondary btn-sm" type="button" disabled={!link.trim()} onClick={attachLink}>Attach</button>
          </div>
          {linkErr && <span className="field-err">{linkErr}</span>}
        </div>
      ) : (
        <>
          <div className="drop" onClick={() => fileRef.current?.click()}>
            <Icon name={type === 'image' ? 'image' : 'upload'} size={22} />
            <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{type === 'image' ? 'Add an image' : 'Attach a file'}</div>
            <div style={{ fontSize: 13 }}>Click to choose - others can open or download it</div>
          </div>
          <input ref={fileRef} type="file" accept={type === 'image' ? 'image/*' : undefined} style={{ display: 'none' }} onChange={onFile} />
        </>
      )}
    </div>
  )
}

type Props = { selfEmail: string }

export default function AddProjectWizard({ selfEmail }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [f, setF] = useState({
    title: '', company: '', startYear: '', endYear: 'Present',
    contrib: 'Owner', description: '', outcome: '',
    vName: '', vRel: 'Manager', vRole: '', vEmail: '', vLink: '', vNote: '',
  })
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [vLinkTouched, setVLinkTouched] = useState(false)

  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))

  // A finished project can't end before it began; "Present" is always valid.
  const periodOk = !f.startYear || f.endYear === 'Present' || +f.endYear >= +f.startYear
  const ok1 = f.title.trim() && f.company.trim() && f.startYear && periodOk
  const descOk = f.description.trim().length >= 10
  const ok2 = descOk && f.outcome.trim()
  const isSelf = emailOk(f.vEmail) && !!selfEmail && f.vEmail.trim().toLowerCase() === selfEmail.toLowerCase()
  const tier = emailOk(f.vEmail) && !isSelf ? badgeTier(f.vEmail) : null
  const ok3 = f.vName.trim() && f.vRole.trim() && emailOk(f.vEmail) && !isSelf
  const labels = ['The work', 'Details & proof', 'Who can verify it']

  function back() {
    if (step > 1) setStep(step - 1)
    else router.push('/dashboard')
  }

  async function submit() {
    if (!ok3) return
    setSubmitting(true)
    setError('')

    let artifactUrl: string | null = null
    if (artifact?.file) {
      const supabase = createClient()
      const ext = (artifact.file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
      const signed = await createUploadUrl('artifacts', ext)
      if ('error' in signed) {
        setSubmitting(false)
        setError("We couldn't upload your artifact. Remove it or try a link instead.")
        return
      }
      const { error: upErr } = await supabase.storage
        .from('artifacts')
        .uploadToSignedUrl(signed.path, signed.token, artifact.file, { contentType: artifact.file.type })
      if (upErr) {
        setSubmitting(false)
        setError("We couldn't upload your artifact. Remove it or try a link instead.")
        return
      }
      artifactUrl = supabase.storage.from('artifacts').getPublicUrl(signed.path).data.publicUrl
    } else if (artifact?.type === 'link') {
      artifactUrl = artifact.value
    }

    const result = await createEntry({
      title: f.title, company: f.company, startYear: f.startYear, endYear: f.endYear,
      contrib: f.contrib, description: f.description, outcome: f.outcome, artifactUrl,
      vName: f.vName, vRel: f.vRel, vRole: f.vRole, vEmail: f.vEmail, vLink: f.vLink, vNote: f.vNote,
    })

    if (result && 'error' in result) {
      setSubmitting(false)
      setError(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="screen"><div className="auth wrap wrap-sm">
        <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 8 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="send" size={28} color="var(--black)" />
          </div>
          <span style={{ position: 'absolute', bottom: -6, right: -6 }}><CheckDot size={26} /></span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px,3vw,32px)' }}>Request sent.</h1>
        <p className="auth-sub">
          Your validator <span className="lblf" style={{ color: 'var(--black)', fontWeight: 600 }}>{f.vEmail.trim()}</span> will
          be asked to confirm it. The entry shows <b>Pending</b> until they do.
        </p>
        <div className="auth-card" style={{ gap: 10 }}>
          <button className="btn btn-primary block" onClick={() => router.push('/dashboard')}>Back to dashboard</button>
        </div>
      </div></div>
    )
  }

  return (
    <div className="screen"><div className="wrap wrap-md" style={{ paddingTop: 'clamp(28px,5vw,48px)', paddingBottom: 48 }}>
      <WizBar current={step} total={3} label={labels[step - 1]} onBack={back} />

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="field"><label className="field-lbl">Project / role title</label>
            <input className="input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="What did you work on?" autoFocus /></div>
          <div className="field"><label className="field-lbl">Company / organisation</label>
            <input className="input" value={f.company} onChange={e => set('company', e.target.value)} placeholder="Where? (a startup, client, college…)" /></div>
          <div className="field"><label className="field-lbl">How long - period</label>
            <div className="row2">
              <select className="input select" value={f.startYear} onChange={e => {
                // If the new start year is after the current end year, snap end back to Present.
                const v = e.target.value
                setF(p => ({ ...p, startYear: v, endYear: p.endYear !== 'Present' && v && +p.endYear < +v ? 'Present' : p.endYear }))
              }}>
                <option value="">Start year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="input select" value={f.endYear} onChange={e => set('endYear', e.target.value)}>
                <option value="Present">Present</option>
                {YEARS.filter(y => !f.startYear || +y >= +f.startYear).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {f.startYear && periodOk && <span className="helper"><Icon name="calendar" size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }} />{periodLabel(f.startYear, f.endYear)} · about {durationLabel(f.startYear, f.endYear)}</span>}
            {f.startYear && !periodOk && <span className="field-err">The end year can&apos;t be before the start year.</span>}
          </div>
          <button className="btn btn-primary block" disabled={!ok1} onClick={() => { setError(''); setStep(2) }}>Continue</button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="field"><label className="field-lbl">Your contribution</label>
            <div className="pills">{['Owner', 'Partner', 'Executor'].map(c => (
              <button key={c} type="button" className={'pill' + (f.contrib === c ? ' sel' : '')} onClick={() => set('contrib', c)}>{c}</button>
            ))}</div></div>
          <div className="field"><label className="field-lbl">What did you do?</label>
            <textarea className="textarea" value={f.description} maxLength={DESC_MAX} onChange={e => set('description', e.target.value)} placeholder="The problem, what you built, how you solved it…" />
            <span className="helper">{f.description.length}/{DESC_MAX} · min 10 characters</span></div>
          <div className="field"><label className="field-lbl">What was the outcome?</label>
            <textarea className="textarea" value={f.outcome} maxLength={OUTCOME_MAX} onChange={e => set('outcome', e.target.value)} placeholder="e.g. grew traffic 3×, shipped the backend, cut drop-off 34%" style={{ minHeight: 80 }} />
            <span className="helper">{f.outcome.length}/{OUTCOME_MAX}</span></div>
          <div className="field"><label className="field-lbl">Attach an artifact · optional</label>
            <ArtifactInput value={artifact} onChange={setArtifact} />
            <span className="helper">A link, image, or file your validator and viewers can open.</span></div>
          <button className="btn btn-primary block" disabled={!ok2} onClick={() => { setError(''); setStep(3) }}>Continue</button>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="callout"><Icon name="info" size={18} /><p>Any email works - Gmail, university or corporate. The badge is <b>honest about how it was verified.</b></p></div>
          <div className="row2">
            <div className="field"><label className="field-lbl">Their name</label>
              <input className="input" value={f.vName} onChange={e => set('vName', e.target.value)} placeholder="Who can confirm this?" /></div>
            <div className="field"><label className="field-lbl">How you worked together</label>
              <select className="input select" value={f.vRel} onChange={e => set('vRel', e.target.value)}>{REL_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <div className="field"><label className="field-lbl">Their role / title at the time</label>
            <input className="input" value={f.vRole} onChange={e => set('vRole', e.target.value)} placeholder="e.g. Founder, Professor, Manager" /></div>
          <div className="field"><label className="field-lbl">Their email</label>
            <input
              className={'input' + (isSelf || (emailTouched && f.vEmail && !emailOk(f.vEmail)) ? ' err' : '')}
              type="email"
              value={f.vEmail}
              onChange={e => { set('vEmail', e.target.value); if (emailTouched) setEmailTouched(true) }}
              onBlur={() => setEmailTouched(true)}
              placeholder="their@email.com"
            />
            {isSelf
              ? <span className="field-err">You can&apos;t verify your own work - use someone else&apos;s email.</span>
              : emailTouched && f.vEmail && !emailOk(f.vEmail)
              ? <span className="field-err">That doesn&apos;t look like a valid email address.</span>
              : tier && <span className="tier-preview"><span className={'status ' + (tier.kind === 'peer' ? 'pending' : 'verified')}>{tier.kind !== 'peer' && <CheckDot size={13} />}{tier.label}</span><span className="helper">This is the badge this entry will earn.</span></span>}
          </div>
          <div className="field"><label className="field-lbl">Their LinkedIn <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--green)' }}>· recommended</span></label>
            <input
              className={'input' + (vLinkTouched && f.vLink && !/linkedin\.com/i.test(f.vLink) ? ' err' : '')}
              value={f.vLink}
              onChange={e => { set('vLink', e.target.value); if (vLinkTouched) setVLinkTouched(true) }}
              onBlur={() => setVLinkTouched(true)}
              placeholder="https://linkedin.com/in/…"
            />
            {vLinkTouched && f.vLink && !/linkedin\.com/i.test(f.vLink) && (
              <span className="field-err">Please paste a LinkedIn link (must contain linkedin.com).</span>
            )}
          </div>
          <div className="field"><label className="field-lbl">Personal note <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--grey-2)' }}>· optional</span></label>
            <textarea className="textarea" value={f.vNote} maxLength={240} onChange={e => set('vNote', e.target.value)} placeholder="Hey - could you confirm this? Takes ~90 seconds. Thanks!" style={{ minHeight: 80 }} /></div>

          {error && <span className="field-err">{error}</span>}

          <button className="btn btn-primary block" disabled={!ok3 || submitting} onClick={submit}>
            {submitting ? <><span className="btn-spin" /> Sending…</> : <><Icon name="send" size={17} color="#fff" /> Send verification request</>}
          </button>
        </div>
      )}
    </div></div>
  )
}
