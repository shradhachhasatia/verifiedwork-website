import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Wordmark, CheckDot } from '@/components/Icon'
import { periodLabel, dateToYear, durationLabel } from '@/lib/format'

const cap = (s: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : '')

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('full_name, title')
    .eq('slug', slug)
    .single()

  if (!user) return { title: 'verified.work' }
  return {
    title: `${user.full_name} - verified.work`,
    description: `${user.full_name}'s verified professional profile on verified.work`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, title, location, photo_url, linkedin_url')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  const { data: entries } = await supabase
    .from('entries')
    .select('id, role_title, company, start_date, end_date, contribution, work_done, metrics, validators(name, role), verifications(sentence, rehire)')
    .eq('user_id', profile.id)
    .eq('status', 'verified')
    .order('start_date', { ascending: false })

  const all = entries ?? []
  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
      <header className="app-head">
        <div className="inner">
          <Wordmark />
          <Link
            href="/login"
            className="btn btn-secondary btn-sm pill"
            style={{ fontSize: 13, minHeight: 36 }}
          >
            Get yours
          </Link>
        </div>
      </header>

      <main style={{ paddingTop: 'var(--nav-h)' }}>
        {/* Hero */}
        <div style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)', padding: 'clamp(32px,5vw,56px) 0' }}>
          <div className="wrap wrap-md" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {profile.photo_url ? (
              <div className="avi" style={{ width: 72, height: 72, flexShrink: 0 }}>
                <img src={profile.photo_url} alt={profile.full_name ?? ''} />
              </div>
            ) : (
              <div className="avi" style={{ width: 72, height: 72, fontSize: 26, flexShrink: 0 }}>
                {(profile.full_name ?? '?')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 className="h1" style={{ fontSize: 'clamp(24px,3vw,36px)' }}>{profile.full_name}</h1>
                <span className="status verified"><CheckDot size={13} /> Verified</span>
              </div>
              {profile.title && (
                <p className="muted" style={{ margin: 0, fontSize: 15 }}>
                  {profile.title}{profile.location ? ` · ${profile.location}` : ''}
                </p>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    marginTop: 12, padding: '7px 14px 7px 11px', borderRadius: 999,
                    border: '1px solid var(--line)', background: 'var(--white)',
                    color: '#0A66C2', fontSize: 13.5, fontWeight: 600,
                    textDecoration: 'none', lineHeight: 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                  </svg>
                  View LinkedIn
                </a>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{all.length}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', letterSpacing: '.04em', textTransform: 'uppercase', marginTop: 4 }}>
                {all.length === 1 ? 'verified project' : 'verified projects'}
              </div>
            </div>
          </div>
        </div>

        {/* Entries */}
        <div className="wrap wrap-md" style={{ paddingTop: 'clamp(24px,4vw,40px)', paddingBottom: 56 }}>
          {all.length === 0 ? (
            <div className="empty card">
              <p className="lede">No verified projects yet.</p>
            </div>
          ) : (
            <div className="stack">
              {all.map(e => {
                const validator = e.validators?.[0] as { name: string | null; role: string | null } | undefined
                const verification = e.verifications?.[0] as { sentence: string | null; rehire: string | null } | undefined
                const period = periodLabel(dateToYear(e.start_date), e.end_date ? dateToYear(e.end_date) : 'Present')
                const duration = durationLabel(dateToYear(e.start_date), e.end_date ? dateToYear(e.end_date) : 'Present')

                return (
                  <div key={e.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <h2 className="h3" style={{ fontSize: 17 }}>{e.role_title}</h2>
                          {e.contribution && (
                            <span className="contrib"><CheckDot size={13} />{cap(e.contribution)}</span>
                          )}
                        </div>
                        <span className="lblf muted" style={{ fontSize: 12.5 }}>
                          {e.company}{period ? ` · ${period}` : ''}{duration ? ` · ${duration}` : ''}
                        </span>
                      </div>
                      <span className="status verified"><CheckDot size={13} /> Verified</span>
                    </div>

                    {verification?.sentence && (
                      <div className="quotebox">
                        <span className="qm">&ldquo;</span>
                        <p>{verification.sentence}</p>
                      </div>
                    )}

                    <div>
                      {validator && (
                        <div className="receipt-row" style={{ borderTop: 0, paddingTop: 0 }}>
                          <span className="k">Verified by</span>
                          <span className="v">{validator.name}{validator.role ? `, ${validator.role}` : ''}</span>
                        </div>
                      )}
                      {verification?.rehire && (
                        <div className="receipt-row">
                          <span className="k">Work again</span>
                          <span className="v" style={{ color: 'var(--green)' }}>{cap(verification.rehire)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
