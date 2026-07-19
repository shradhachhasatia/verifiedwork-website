import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Wordmark, CheckDot, Icon, LinkedInLogo } from '@/components/Icon'
import { periodLabel, dateToYear, durationLabel } from '@/lib/format'

const cap = (s: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : '')
const isImage = (url: string) => /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url)

function Detail({ label, children, accent }: { label: string; children: ReactNode; accent?: boolean }) {
  return (
    <div>
      <div className="lblf muted" style={{ fontSize: 11.5, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: accent ? 'var(--green)' : 'var(--black)', fontWeight: accent ? 600 : 400 }}>{children}</p>
    </div>
  )
}

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
    .select('id, full_name, title, location, photo_url, linkedin_url, website_url, website_label, premium')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  const { data: entries } = await supabase
    .from('entries')
    .select('id, role_title, company, start_date, end_date, contribution, problem_solved, work_done, metrics, artifact_url, validators(name, role, linkedin), verifications(sentence, rehire)')
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
                {profile.premium && (
                  <span className="status" style={{ background: 'var(--green-tint)', color: 'var(--green-deep)', fontFamily: 'var(--label)' }}>&#9733; Founding member</span>
                )}
              </div>
              {profile.title && (
                <p className="muted" style={{ margin: 0, fontSize: 15 }}>
                  {profile.title}{profile.location ? ` · ${profile.location}` : ''}
                </p>
              )}
              {(profile.linkedin_url || profile.website_url) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '7px 14px 7px 11px', borderRadius: 999,
                        border: '1px solid var(--line)', background: 'var(--white)',
                        color: '#0A66C2', fontSize: 13.5, fontWeight: 600,
                        textDecoration: 'none', lineHeight: 1,
                      }}
                    >
                      <LinkedInLogo size={16} />
                      LinkedIn
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '7px 14px 7px 11px', borderRadius: 999,
                        border: '1px solid var(--line)', background: 'var(--white)',
                        color: 'var(--black)', fontSize: 13.5, fontWeight: 600,
                        textDecoration: 'none', lineHeight: 1,
                      }}
                    >
                      <Icon name="globe" size={15} />
                      {profile.website_label === 'personal' ? 'Personal website' : profile.website_label === 'company' ? 'Company website' : 'Website'}
                    </a>
                  )}
                </div>
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
                const validator = e.validators?.[0] as { name: string | null; role: string | null; linkedin: string | null } | undefined
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

                    {(e.problem_solved || e.work_done || e.metrics) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {e.problem_solved && <Detail label="The problem">{e.problem_solved}</Detail>}
                        {e.work_done && <Detail label="What I did">{e.work_done}</Detail>}
                        {e.metrics && <Detail label="Outcome" accent>{e.metrics}</Detail>}
                      </div>
                    )}

                    {e.artifact_url && (
                      isImage(e.artifact_url) ? (
                        <a href={e.artifact_url} target="_blank" rel="noopener noreferrer">
                          <img src={e.artifact_url} alt="Project artifact" style={{ borderRadius: 12, border: '1px solid var(--line)', maxHeight: 180, width: 'auto' }} />
                        </a>
                      ) : (
                        <a className="tlink" href={e.artifact_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                          <Icon name="link" size={14} /> View proof / artifact <Icon name="arrowUpRight" size={14} />
                        </a>
                      )
                    )}

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
                          <span className="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {validator.name}{validator.role ? `, ${validator.role}` : ''}
                            {validator.linkedin && (
                              <a href={validator.linkedin} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${validator.name ?? 'Validator'} on LinkedIn`} style={{ display: 'inline-flex' }}>
                                <LinkedInLogo size={15} />
                              </a>
                            )}
                          </span>
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
