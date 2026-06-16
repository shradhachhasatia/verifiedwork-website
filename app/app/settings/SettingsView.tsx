'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from './actions'
import AccountActions from '@/app/dashboard/AccountActions'
import { Icon } from '@/components/Icon'

type Props = {
  userId: string
  initial: {
    full_name: string
    title: string
    location: string
    linkedin_url: string
    photo_url: string | null
  }
}

export default function SettingsView({ userId, initial }: Props) {
  const [name, setName] = useState(initial.full_name)
  const [title, setTitle] = useState(initial.title)
  const [location, setLocation] = useState(initial.location)
  const [linkedin, setLinkedin] = useState(initial.linkedin_url)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photo_url)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial.photo_url)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Please choose a JPG or PNG.'); return }
    if (f.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return }
    setError('')
    setPhotoFile(f)
    setPhotoPreview(URL.createObjectURL(f))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError('')

    let finalPhotoUrl = photoUrl

    if (photoFile) {
      setUploading(true)
      const supabase = createClient()
      const ext = (photoFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type })
      setUploading(false)
      if (upErr) {
        setSaving(false)
        setError("Couldn't upload photo. Try again.")
        return
      }
      finalPhotoUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      setPhotoUrl(finalPhotoUrl)
      setPhotoFile(null)
    }

    const result = await updateProfile({ full_name: name, title, location, linkedin_url: linkedin, photo_url: finalPhotoUrl })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    setSaved(true)
  }

  return (
    <div className="screen">
      <div className="wrap wrap-sm" style={{ paddingTop: 'clamp(28px,5vw,48px)', paddingBottom: 56 }}>
        <span className="eyebrow">Account</span>
        <h1 className="h1" style={{ marginTop: 12, fontSize: 'clamp(24px,3vw,34px)', marginBottom: 28 }}>Settings</h1>

        {/* Photo */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <p className="field-lbl" style={{ marginBottom: 14 }}>Profile photo</p>
          <div className="photo-up">
            <button type="button" className="photo-btn" onClick={() => photoRef.current?.click()}>
              {photoPreview
                ? <img src={photoPreview} alt="" />
                : <Icon name="camera" size={22} />}
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
            <label className="field-lbl">LinkedIn URL <span className="muted" style={{ fontWeight: 400 }}>· optional</span></label>
            <input
              className="input"
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              type="url"
            />
          </div>
        </div>

        {error && <div className="auth-alert" style={{ marginBottom: 12 }}><span>{error}</span></div>}
        {saved && <p className="muted" style={{ fontSize: 13.5, marginBottom: 12, color: 'var(--green)' }}>Changes saved.</p>}

        <button className="btn btn-primary block pill" disabled={saving} onClick={handleSave}>
          {saving ? <><span className="btn-spin" /> {uploading ? 'Uploading…' : 'Saving…'}</> : 'Save changes'}
        </button>

        {/* Account actions */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <p className="field-lbl" style={{ marginBottom: 14 }}>Account</p>
          <AccountActions />
        </div>
      </div>
    </div>
  )
}
