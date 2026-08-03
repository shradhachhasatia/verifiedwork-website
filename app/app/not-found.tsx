import Link from 'next/link'
import { Wordmark } from '@/components/Icon'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
      <header className="app-head">
        <div className="inner">
          <Link href="/" aria-label="verified.work" style={{ textDecoration: 'none' }}>
            <Wordmark />
          </Link>
        </div>
      </header>
      <div className="wrap wrap-sm" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 18, paddingTop: 'var(--nav-h)', paddingBottom: 56 }}>
        <div className="lblf" style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--grey)' }}>404</div>
        <h1 className="h2">This page doesn&rsquo;t exist</h1>
        <p className="lede" style={{ maxWidth: 400 }}>
          The link may be outdated or mistyped. Everything starts from the home page.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary pill">Go to home</Link>
          <Link href="/login" className="btn btn-secondary pill">Sign in</Link>
        </div>
      </div>
    </main>
  )
}
