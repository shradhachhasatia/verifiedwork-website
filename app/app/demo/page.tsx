import Link from 'next/link'
import { Wordmark } from '@/components/Icon'
import DemoView from './DemoView'

export const metadata = {
  title: 'Validator demo - verified.work',
  description: 'See exactly how someone verifies your work, step by step.',
}

export default function DemoPage() {
  return (
    <main className="app-main">
      <header className="app-head">
        <div className="inner">
          <a href="/" aria-label="verified.work" style={{ textDecoration: 'none' }}><Wordmark /></a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/" className="btn btn-ghost btn-sm">← Home</a>
            <Link href="/login" className="btn btn-primary btn-sm pill">Try free</Link>
          </div>
        </div>
      </header>
      <DemoView />
    </main>
  )
}
