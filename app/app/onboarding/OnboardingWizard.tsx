'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createUploadUrl } from '@/lib/storage-actions'
import { completeOnboarding } from './actions'

/* ---------- small bits ported from the mockup ---------- */
function CameraIcon({ size = 22 }: { size?: number }) {
  const P = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" {...P} />
      <circle cx="12" cy="13" r="3" {...P} />
    </svg>
  )
}
function ArrowLeft({ size = 16 }: { size?: number }) {
  const P = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" {...P} />
      <polyline points="12 19 5 12 12 5" {...P} />
    </svg>
  )
}
function Avatar({ name = '', size = 56, src }: { name?: string; size?: number; src?: string | null }) {
  const initials =
    name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <span
      className="avi"
      style={{ width: size, height: size, fontSize: size * 0.36, background: src ? 'transparent' : 'var(--black)' }}
    >
      {src ? <img src={src} alt={name} /> : initials}
    </span>
  )
}
function WizBar({ current, total, label, onBack }: { current: number; total: number; label?: string; onBack?: (() => void) | null }) {
  return (
    <div className="wiz">
      <div className="wiz-top">
        {onBack ? (
          <button className="wiz-back" onClick={onBack} aria-label="Back"><ArrowLeft size={16} /></button>
        ) : (
          <span style={{ width: 36 }} />
        )}
        <div className="wiz-bar"><i style={{ width: (current / total * 100) + '%' }} /></div>
        <span className="wiz-step">{current}/{total}</span>
      </div>
      {label && <h1 className="h2" style={{ marginTop: 16, fontSize: 'clamp(22px,2vw,30px)' }}>{label}</h1>}
    </div>
  )
}

type Props = { initialName: string; initialPhotoUrl: string | null }

export default function OnboardingWizard({ initialName, initialPhotoUrl }: Props) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initialName || '')
  const [title, setTitle] = useState('')
  const [loc, setLoc] = useState('')
  const [handle, setHandle] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  const autoHandle = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const h = handle || autoHandle

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('That file isn’t an image. Please choose a JPG or PNG.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('That image is over 5 MB. Please choose a smaller one.')
      return
    }
    setError('')
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoUrl(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  async function create() {
    if (!h) return
    setSubmitting(true)
    setError('')

    let finalPhotoUrl = photoUrl

    // Upload the chosen photo (if any) into the user's own avatars folder.
    // The signed URL is minted server-side (where the session lives); the
    // browser then uploads straight to Storage with that one-time token.
    if (photoFile) {
      setUploadingPhoto(true)
      const supabase = createClient()
      const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const signed = await createUploadUrl('avatars', ext)
      if ('error' in signed) {
        setUploadingPhoto(false)
        setSubmitting(false)
        setError("We couldn't upload your photo. You can skip it for now and add one later.")
        return
      }
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .uploadToSignedUrl(signed.path, signed.token, photoFile, { contentType: photoFile.type })
      setUploadingPhoto(false)
      if (upErr) {
        setSubmitting(false)
        setError("We couldn't upload your photo. You can skip it for now and add one later.")
        return
      }
      finalPhotoUrl = supabase.storage.from('avatars').getPublicUrl(signed.path).data.publicUrl
    }

    const result = await completeOnboarding({
      full_name: name.trim(),
      title: title.trim(),
      location: loc.trim(),
      slug: h,
      photo_url: finalPhotoUrl,
    })

    // On success the action redirects; we only get here on a handled error.
    if (result?.error) {
      setSubmitting(false)
      setError(result.error)
    }
  }

  return (
    <div className="screen">
      <div className="wrap wrap-sm" style={{ paddingTop: 'clamp(28px,5vw,52px)', paddingBottom: 48 }}>
        <WizBar
          current={step}
          total={2}
          label={step === 1 ? 'About you' : 'Your profile link'}
          onBack={step > 1 ? () => setStep(step - 1) : null}
        />

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p className="lede" style={{ marginTop: -8 }}>
              The basics for your public profile. You can change these any time.
            </p>
            <div className="field">
              <label className="field-lbl">Full name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoFocus />
            </div>
            <div className="field">
              <label className="field-lbl">Current or most recent title</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Product designer" />
            </div>
            <div className="field">
              <label className="field-lbl">City / country</label>
              <input className="input" value={loc} onChange={e => setLoc(e.target.value)} placeholder="e.g. Bengaluru, India" />
            </div>
            <button
              className="btn btn-primary block"
              disabled={!name.trim() || !title.trim()}
              onClick={() => { setError(''); setStep(2) }}
            >
              Continue
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p className="lede" style={{ marginTop: -8 }}>
              Claim your link and add a photo. Here&apos;s how it&apos;ll look.
            </p>
            <div className="field">
              <label className="field-lbl">Your profile link</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="lblf muted" style={{ fontSize: 14 }}>verified.work/</span>
                <input
                  className="input"
                  value={h}
                  onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="yourname"
                />
              </div>
            </div>
            <div className="field">
              <label className="field-lbl">Profile photo · optional</label>
              <div className="photo-up">
                <button type="button" className="photo-btn" onClick={() => photoRef.current?.click()}>
                  {photoPreview ? <img src={photoPreview} alt="" /> : <CameraIcon size={22} />}
                </button>
                <div>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => photoRef.current?.click()}>
                    Upload photo
                  </button>
                  {photoPreview && (
                    <button className="btn btn-ghost btn-sm" type="button" onClick={removePhoto}>Remove</button>
                  )}
                </div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
              </div>
            </div>
            <div className="prevcard">
              <Avatar name={name} src={photoPreview} size={56} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-.01em' }}>{name || 'Your name'}</div>
                <div className="muted" style={{ fontSize: 14 }}>{title || 'Your title'}</div>
                <div className="lblf" style={{ fontSize: 12.5, color: 'var(--grey)', marginTop: 2 }}>verified.work/{h || 'yourname'}</div>
              </div>
            </div>

            {error && <span className="field-err">{error}</span>}

            <button className="btn btn-primary block" disabled={!h || submitting} onClick={create}>
              {submitting
                ? <><span className="btn-spin" /> {uploadingPhoto ? 'Uploading photo…' : 'Creating profile…'}</>
                : 'Create my profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
