'use client'

import { useEffect, useState } from 'react'

/* Shows the "become a founding member" banner (until they're premium) and a
   one-off toast when they return from Razorpay via /dashboard?upgraded=1. */
export default function UpgradeBanner({ premium }: { premium: boolean }) {
  const [toast, setToast] = useState<{ kind: 'ok' | 'info' | 'err'; msg: string } | null>(null)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('upgraded')) setToast({ kind: 'ok', msg: "You're a founding member \u{1F389}  Payment confirmed." })
    else if (p.get('already')) setToast({ kind: 'info', msg: "You're already a founding member." })
    else if (p.get('upgrade_error')) setToast({ kind: 'err', msg: "We couldn't start checkout. Please try again." })
    if (p.has('upgraded') || p.has('already') || p.has('upgrade_error')) {
      window.history.replaceState({}, '', '/dashboard')
      const t = setTimeout(() => setToast(null), 6000)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <>
      {!premium && (
        <div className="wrap wrap-md" style={{ paddingTop: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            background: 'linear-gradient(100deg,var(--green-deep),var(--green))', color: '#fff',
            borderRadius: 18, padding: '20px 24px',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--label)', fontWeight: 700, fontSize: 16 }}>&#9733; Become a founding member</div>
              <div style={{ fontSize: 14, opacity: .92, marginTop: 3 }}>Unlimited verified projects, a founding badge and more &mdash; <b>$10</b> one-time.</div>
            </div>
            <a href="/upgrade" className="btn btn-sm" style={{ flexShrink: 0, background: '#fff', color: 'var(--green-deep)', fontWeight: 700, borderRadius: 999 }}>Upgrade</a>
          </div>
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
