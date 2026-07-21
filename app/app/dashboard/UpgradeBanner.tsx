'use client'

import { useEffect, useState } from 'react'

/* Shows the founding-member entry point (or a "add N more projects" nudge until
   they're eligible), and a one-off toast when they return from Razorpay. */
export default function UpgradeBanner({
  premium,
  paymentsEnabled,
  projectCount,
  minProjects,
}: {
  premium: boolean
  paymentsEnabled: boolean
  projectCount: number
  minProjects: number
}) {
  const [toast, setToast] = useState<{ kind: 'ok' | 'info' | 'err'; msg: string } | null>(null)
  const eligible = projectCount >= minProjects
  const remaining = Math.max(0, minProjects - projectCount)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('upgraded')) setToast({ kind: 'ok', msg: "You're a founding member \u{1F389}  Payment confirmed." })
    else if (p.get('already')) setToast({ kind: 'info', msg: "You're already a founding member." })
    else if (p.get('upgrade_error')) setToast({ kind: 'err', msg: "We couldn't start checkout. Please try again." })
    else if (p.get('need_projects')) setToast({ kind: 'info', msg: `Add ${minProjects} projects first to unlock founding-member pricing.` })
    if (p.has('upgraded') || p.has('already') || p.has('upgrade_error') || p.has('need_projects')) {
      window.history.replaceState({}, '', '/dashboard')
      const t = setTimeout(() => setToast(null), 6000)
      return () => clearTimeout(t)
    }
  }, [minProjects])

  return (
    <>
      {!premium && paymentsEnabled && (
        <div className="wrap wrap-md" style={{ paddingTop: 20 }}>
          {eligible ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              background: 'linear-gradient(100deg,var(--green-deep),var(--green))', color: '#fff',
              borderRadius: 18, padding: '20px 24px',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--label)', fontWeight: 700, fontSize: 16 }}>&#9733; Become a founding member</div>
                <div style={{ fontSize: 14, opacity: .92, marginTop: 3 }}>Unlimited verified projects, a founding badge and more - <b>$10</b> one-time.</div>
              </div>
              <a href="/upgrade" className="btn btn-sm" style={{ flexShrink: 0, background: '#fff', color: 'var(--green-deep)', fontWeight: 700, borderRadius: 999 }}>Upgrade</a>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 18, padding: '18px 22px',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--label)', fontWeight: 700, fontSize: 15, color: 'var(--black)' }}>&#9733; Founding member - $10 one-time</div>
                <div style={{ fontSize: 13.5, color: 'var(--grey)', marginTop: 3 }}>
                  Add <b>{remaining}</b> more {remaining === 1 ? 'project' : 'projects'} to unlock it. <span style={{ fontVariantNumeric: 'tabular-nums' }}>({projectCount}/{minProjects})</span>
                </div>
              </div>
              <a href="/add" className="btn btn-secondary btn-sm" style={{ flexShrink: 0, borderRadius: 999 }}>Add a project</a>
            </div>
          )}
        </div>
      )}
      {toast && (
        <div role="status" style={{
          position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 100,
          background: toast.kind === 'err' ? '#B91C1C' : 'var(--black)', color: '#fff', fontWeight: 600, fontSize: 14,
          padding: '13px 20px', borderRadius: 12, boxShadow: '0 20px 40px -16px rgba(0,0,0,.4)', maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
