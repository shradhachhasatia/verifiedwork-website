'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createUploadUrl } from '@/lib/storage-actions'
import { updateProfile, deleteAccount } from './actions'
import { signOut } from '@/lib/auth-actions'
import { Icon, LinkedInLogo } from '@/components/Icon'

const linkedinOk = (v: string) => !v.trim() || /linkedin\.com/i.test(v.trim())

type Props = {
  slug: string
  initial: {
    full_name: string
    title: string
    location: string
    linkedin_url: string
    website_url: string
    website_label: string
    photo_url: string | null
  }
}

export default function SettingsView({ slug, initial }: Props) {
  const [name, setName] = useState(initial.full_name)
  const [title, setTitle] = useState(initial.title)
  const [location, setLocation] = useState(initial.location)
  const [linkedin, setLinkedin] = useState(initial.linkedin_url)
  const [website, setWebsite] = useState(initial.website_url)
  const [websiteLabel, setWebsiteLabel] = useState<'company' | 'personal'>(initial.website_label === 'personal' ? 'personal' : 'company')
  const [linkedinTouched, setLinkedinTouched] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photo_url)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photo_url)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`
  const linkedinErr = linkedinTouched && !linkedinOk(linkedin)

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Please choose a JPG or PNG.'); return }
    if (f.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return }
    setError('')
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    if (linkedinErr) return
    setSaving(true)
    setSaved(false)
    setError('')

    let finalPhotoUrl = photoUrl
    if (photoFile) {
      setUploading(true)
      const supabase = createClient()
      const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const signed = await createUploadUrl('avatars', ext)
      if ('error' in signed) { setUploading(false); setSaving(false); setError("Couldn't upload photo. Try again."); return }
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .uploadToSignedUrl(signed.path, signed.token, photoFile, { contentType: photoFile.type })
      setUploading(false)
      if (upErr) { setSaving(false); setError("Couldn't upload photo. Try again."); return }
      finalPhotoUrl = supabase.storage.from('avatars').getPublicUrl(signed.path).data.publicUrl
      setPhotoUrl(finalPhotoUrl)
      setPhotoFile(null)
    }

    const result = await updateProfile({
      full_name: name, title, location,
      linkedin_url: linkedin.trim(),
      website_url: website.trim(),
      website_label: websiteLabel,
      photo_url: finalPhotoUrl,
    })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    setSaved(true)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteAccount()
    if ('error' in result) { setDeleting(false); setError(result.error); return }
    const supabase = createClient()
    await supabase.auth.signOut()
    // Full document load (not router.push) so the deleted account's pages are
    // gone from the browser cache immediately - no stale dashboard on "back".
    window.location.replace('/login')
  }

  return (
    <div className="screen">
      <div className="wrap wrap-sm" style={{ paddingTop: 'clamp(28px,5vw,48px)', paddingBottom: 56 }}>
        <span className="eyebrow">Account</span>
        <h1 className="h1" style={{ marginTop: 12, fontSize: 'clamp(24px,3vw,34px)', marginBottom: 28 }}>Settings</h1>

        {/* Profile link */}
        {slug && (
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <p className="field-lbl" style={{ marginBottom: 10 }}>Your profile link</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="input"
                style={{ flex: 1, color: 'var(--green)', fontWeight: 500, fontSize: 14, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, minHeight: 44 }}
              >
                <Icon name="link" size={14} />
                {profileUrl.replace(/^https?:\/\//, '')}
              </a>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flexShrink: 0 }}
                onClick={handleCopy}
              >
                {copied ? <><Icon name="check" size={14} /> Copied</> : 'Copy link'}
              </button>
            </div>
          </div>
        )}

        {/* Photo */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <p className="field-lbl" style={{ marginBottom: 14 }}>Profile photo</p>
          <div className="photo-up">
            <button type="button" className="photo-btn" onClick={() => photoRef.current?.click()}>
              {photoPreview ? <img src={photoPreview} alt="" /> : <Icon name="camera" size={22} />}
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => photoRef.current?.click()}>
                {photoPreview ? 'Change photo' : 'Upload photo'}
              </button>
              {photoPreview && (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => {
                  setPhotoFile(null); setPhotoPreview(null); setPhotoUrl(null)
                  if (photoRef.current) photoRef.current.value = ''
                }}>Remove</button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
          </div>
        </div>

        {/* Profile info */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div className="field">
            <label className="field-lbl">Full name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="field">
            <label className="field-lbl">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Product designer" />
          </div>
          <div className="field">
            <label className="field-lbl">City / country</label>
            <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bengaluru, India" />
          </div>
          <div className="field">
            <label className="field-lbl" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LinkedInLogo size={14} /> LinkedIn <span className="muted" style={{ fontWeight: 400 }}>· optional</span>
            </label>
            <input
              className={'input' + (linkedinErr ? ' err' : '')}
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              onBlur={() => setLinkedinTouched(true)}
              placeholder="https://linkedin.com/in/yourname"
              type="url"
            />
            {linkedinErr && <span className="field-err">Please paste a LinkedIn link (must contain linkedin.com).</span>}
          </div>
          <div className="field">
            <label className="field-lbl" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="globe" size={14} /> Website <span className="muted" style={{ fontWeight: 400 }}>· optional</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="input"
                style={{ maxWidth: 130, flexShrink: 0 }}
                value={websiteLabel}
                onChange={e => setWebsiteLabel(e.target.value as 'company' | 'personal')}
                aria-label="Website type"
              >
                <option value="company">Company</option>
                <option value="personal">Personal</option>
              </select>
              <input
                className="input"
                style={{ flex: 1 }}
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="e.g. yourcompany.com"
              />
            </div>
          </div>
        </div>

        {error && <div className="auth-alert" style={{ marginBottom: 12 }}><span>{error}</span></div>}
        {saved && <p style={{ fontSize: 13.5, marginBottom: 12, color: 'var(--green)' }}>Changes saved.</p>}

        <button className="btn btn-primary block pill" disabled={saving || !!linkedinErr} onClick={handleSave}>
          {saving ? <><span className="btn-spin" /> {uploading ? 'Uploading…' : 'Saving…'}</> : 'Save changes'}
        </button>

        {/* Feedback */}
        <a
          href="/feedback"
          className="card card-pad"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8, textDecoration: 'none', color: 'inherit' }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Share feedback</p>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>Report a bug or suggest an idea - it goes straight to the team.</p>
          </div>
          <Icon name="arrowUpRight" size={18} />
        </a>

        {/* Sign out + delete */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="field-lbl" style={{ marginBottom: 2 }}>Account</p>

          <form action={signOut} style={{ alignSelf: 'flex-start' }}>
            <button className="btn btn-secondary btn-sm pill" type="submit">
              Sign out
            </button>
          </form>

          {!confirmDelete ? (
            <button
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', color: '#dc2626', fontSize: 13 }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete account
            </button>
          ) : (
            <div className="card card-pad" style={{ borderColor: '#fecaca', background: '#fff5f5' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', marginBottom: 6 }}>Delete your account?</p>
              <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
                This permanently removes your profile, all projects, and verifications. You&apos;ll get a confirmation email. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
                <button
                  className="btn btn-sm pill"
                  style={{ background: '#dc2626', color: '#fff' }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <><span className="btn-spin" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} /> Deleting…</> : 'Yes, delete everything'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
