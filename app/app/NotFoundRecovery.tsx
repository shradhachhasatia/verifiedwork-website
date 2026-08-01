'use client'

import { useEffect, useState } from 'react'

// Some visitors get a 404 for /checkout.html served from outside the current
// deployment (stale DNS / edge state) even though the file exists here. Probe
// the same path once with a cache-busting request: if the origin actually has
// it, reload onto the real page; the `r` param stops a second attempt so a
// genuinely missing page never loops.
export default function NotFoundRecovery() {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('r')) {
      setChecking(false)
      return
    }
    fetch(`${url.pathname}?ping=${Date.now()}`, { cache: 'reload' })
      .then(res => {
        if (res.ok) {
          url.searchParams.set('r', '1')
          window.location.replace(url.toString())
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [])

  if (!checking) return null
  return <p className="muted" style={{ fontSize: 13, margin: 0 }}>Checking for the latest version of this page&hellip;</p>
}
