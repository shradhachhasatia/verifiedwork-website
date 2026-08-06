'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/* Shows the founding-member entry point once they've added enough projects, and
   a one-off toast when they return from Razorpay. Until then it stays hidden -
   no locked "add N more" nudge, so the upgrade only ever surfaces when it's
   actually available.

   The post-payment toast is driven by `premium` (read from the database by the
   server component), not by the query param alone. It used to claim "Payment
   confirmed" purely because ?upgraded=1 was present, which told people their
   payment had gone through while their account was still on the free plan. */
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
  const router = useRouter()
  const [param, setParam] = useState<string | null>(null)
  const [refreshed, setRefreshed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const eligible = projectCount >= minProjects

  // Read the return-from-Razorpay param once, then strip it from the URL so a
  // reload or a shared link can't replay the toast.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const found = ['upgraded', 'upgrade_pending', 'already', 'upgrade_error', 'need_projects', 'project_limit']
      .find(k => p.has(k)) ?? null
    if (found) {
      setParam(found)
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  const paid = param === 'upgraded' || param === 'upgrade_pending'
  // They're back from a payment but the grant hasn't shown up in this render yet
  // - the webhook backstop can land a moment after the callback redirect.
  const activating = paid && !premium && !refreshed

  // Exactly one re-fetch, so a grant that lands a second late resolves the page
  // without the user reloading - and so this can't turn into an endless spinner
  // if it never lands.
  useEffect(() => {
    if (!activating) return
    const t = setTimeout(() => {
      setRefreshed(true)
      router.refresh()
    }, 2500)
    return () => clearTimeout(t)
  }, [activating, router])

  useEffect(() => {
    if (!param || activating) return
    const t = setTimeout(() => setDismissed(true), 6000)
    return () => clearTimeout(t)
  }, [param, activating])

  const toast = ((): { kind: 'ok' | 'info' | 'err'; msg: string } | null => {
    if (!param) return null
    if (paid) {
      if (premium) return { kind: 'ok', msg: "You're a founding member \u{1F389}  Payment confirmed." }
      if (activating) return { kind: 'info', msg: 'Payment received - activating your membership...' }
      return { kind: 'info', msg: "Payment received. Your membership will activate shortly - reload in a minute if the badge hasn't appeared." }
    }
    if (param === 'already') return { kind: 'info', msg: "You're already a founding member." }
    if (param === 'upgrade_error') return { kind: 'err', msg: "We couldn't start checkout. Please try again." }
    if (param === 'need_projects') return { kind: 'info', msg: `Get ${minProjects} projects verified first to unlock founding-member pricing.` }
    if (param === 'project_limit') return { kind: 'info', msg: `Free accounts can hold up to ${minProjects} projects. Become a founding member for unlimited.` }
    return null
  })()

  return (
    <>
      {!premium && paymentsEnabled && eligible && (
        <div className="wrap wrap-md" style={{ paddingTop: 20 }}>
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
        </div>
      )}
      {toast && !dismissed && (
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
