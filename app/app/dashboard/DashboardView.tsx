'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, CheckDot } from '@/components/Icon'
import { periodLabel, durationLabel, dateToYear } from '@/lib/format'
import { deleteEntry } from './actions'

type Validator = { name: string | null; role: string | null }
type Verification = { sentence: string | null; rehire: string | null }

export type Entry = {
  id: string
  role_title: string | null
  company: string | null
  start_date: string | null
  end_date: string | null
  contribution: string | null
  metrics: string | null
  artifact_url: string | null
  status: string | null
  validators: Validator[]
  verifications: Verification[]
}

const cap = (s: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : '')
const isImage = (url: string) => /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url)

function ArtifactView({ url }: { url: string }) {
  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img src={url} alt="" style={{ borderRadius: 12, border: '1px solid var(--line)', maxHeight: 120, width: 'auto' }} />
      </a>
    )
  }
  return (
    <a className="tlink" href={url} target="_blank" rel="noopener noreferrer">
      <Icon name="link" size={14} /> View artifact <Icon name="arrowUpRight" size={14} />
    </a>
  )
}

function ProjectCard({ e, open, onToggle, onDelete }: { e: Entry; open: boolean; onToggle: () => void; onDelete: (id: string) => Promise<void> }) {
  const status = e.status === 'verified' ? 'verified' : e.status === 'pending' ? 'pending' : 'unverified'
  const validator = e.validators?.[0]
  const verification = e.verifications?.[0]
  const period = periodLabel(dateToYear(e.start_date), e.end_date ? dateToYear(e.end_date) : 'Present')
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [err, setErr] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setErr('')
    try {
      await onDelete(e.id)
    } catch {
      setDeleting(false)
      setErr("Couldn't delete. Please try again.")
    }
  }

  return (
    <div className={'xcard' + (open ? ' open' : '')}>
      <button className="xcard-head" onClick={onToggle} aria-expanded={open}>
        <div className="x-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h3 className="h3" style={{ fontSize: 17 }}>{e.role_title}</h3>
            <span className={'status ' + status}>{status === 'verified' && <CheckDot size={13} />}{cap(status)}</span>
          </div>
          <span className="lblf muted" style={{ fontSize: 12.5 }}>
            {e.company}{period ? ` · ${period}` : ''} · {durationLabel(dateToYear(e.start_date), e.end_date ? dateToYear(e.end_date) : 'Present')}
          </span>
        </div>
        {e.contribution && <span className="contrib">{status === 'verified' && <CheckDot size={14} />}{cap(e.contribution)}</span>}
        <span className="xcard-toggle"><Icon name="chevronDown" size={14} stroke={2.4} /></span>
      </button>
      <div className="xcard-more"><div className="xcard-more-inner">
        <div style={{ padding: '0 clamp(16px,2.2vw,22px) clamp(18px,2.2vw,22px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {status === 'verified' && verification?.sentence ? (
            <div className="quotebox"><span className="qm">&ldquo;</span><p>{verification.sentence}</p></div>
          ) : (
            <div className="callout"><Icon name="info" size={18} /><p>Awaiting verification from <b>{validator?.name || 'your validator'}</b>. We&apos;ll stamp it the moment they confirm.</p></div>
          )}
          <div>
            {e.metrics && <div className="receipt-row" style={{ borderTop: 0 }}><span className="k">Outcome</span><span className="v">{e.metrics}</span></div>}
            <div className="receipt-row"><span className="k">Validator</span><span className="v">{validator?.name}{validator?.role ? `, ${validator.role}` : ''}</span></div>
            {status === 'verified' && verification?.rehire && (
              <div className="receipt-row"><span className="k">Work again</span><span className="v" style={{ color: 'var(--green)' }}>{verification.rehire}</span></div>
            )}
          </div>
          {e.artifact_url && <ArtifactView url={e.artifact_url} />}

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 2 }}>
            {!confirm ? (
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: '#dc2626', fontSize: 13 }}
                onClick={() => setConfirm(true)}
              >
                <Icon name="trash" size={14} /> Delete project
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                  Delete this project and its verification? This can&apos;t be undone.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)} disabled={deleting}>Cancel</button>
                  <button
                    className="btn btn-sm pill"
                    style={{ background: '#dc2626', color: '#fff' }}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? <><span className="btn-spin" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> Deleting…</> : 'Yes, delete'}
                  </button>
                </div>
                {err && <span className="field-err">{err}</span>}
              </div>
            )}
          </div>
        </div>
      </div></div>
    </div>
  )
}

export default function DashboardView({ firstName, entries }: { firstName: string; entries: Entry[] }) {
  const router = useRouter()
  const [items, setItems] = useState<Entry[]>(entries)
  const [openId, setOpenId] = useState<string | null>(entries[0]?.id ?? null)
  const verified = items.filter(e => e.status === 'verified').length

  async function handleDelete(id: string) {
    const result = await deleteEntry(id)
    if ('error' in result) throw new Error(result.error)
    setItems(prev => prev.filter(e => e.id !== id)) // remove instantly
    router.refresh() // re-sync with the server
  }

  if (items.length === 0) {
    return (
      <div className="screen"><div className="wrap wrap-lg" style={{ paddingTop: 'clamp(28px,5vw,48px)' }}>
        <span className="eyebrow">Your workspace</span>
        <h1 className="h1" style={{ marginTop: 14, fontSize: 'clamp(26px,3vw,38px)' }}>Hi{firstName ? `, ${firstName}` : ''}.</h1>
        <div className="empty card" style={{ marginTop: 24 }}>
          <span className="ic"><Icon name="layers" size={26} /></span>
          <div><h2 className="h3" style={{ marginBottom: 8 }}>Add your first project</h2>
            <p className="lede" style={{ maxWidth: '40ch' }}>Showcase what you actually built, then invite someone who was there to verify it.</p></div>
          <button className="btn btn-primary pill" style={{ maxWidth: 260 }} onClick={() => router.push('/add')}><Icon name="plus" size={18} color="#fff" /> Add a project</button>
        </div>
      </div></div>
    )
  }

  const pct = Math.min(100, 30 + Math.round(verified / items.length * 70))
  return (
    <div className="screen"><div className="wrap wrap-lg" style={{ paddingTop: 'clamp(28px,5vw,48px)', paddingBottom: 40 }}>
      <div className="dash-hd">
        <div><span className="eyebrow">Your workspace</span>
          <h1 className="h1" style={{ marginTop: 12, fontSize: 'clamp(26px,3vw,38px)' }}>Hi{firstName ? `, ${firstName}` : ''}.</h1></div>
        <button className="btn btn-primary btn-sm pill" onClick={() => router.push('/add')}><Icon name="plus" size={16} color="#fff" /> Add a project</button>
      </div>
      <div className="complete">
        <div><div style={{ fontWeight: 700, marginBottom: 4 }}>Profile {pct}% complete</div>
          <div className="muted" style={{ fontSize: 13.5 }}>{verified} verified · {items.length - verified} awaiting</div></div>
        <div className="bar"><i style={{ width: pct + '%' }} /></div>
      </div>
      <div className="sec-head"><span className="eyebrow">Your work</span><span className="n">{items.length}</span><span className="ln" /></div>
      <div className="stack">
        {items.map(e => (
          <ProjectCard key={e.id} e={e} open={openId === e.id} onToggle={() => setOpenId(o => o === e.id ? null : e.id)} onDelete={handleDelete} />
        ))}
      </div>
    </div></div>
  )
}
