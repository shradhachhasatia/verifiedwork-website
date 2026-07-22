// Pure helpers shared by the dashboard and the add-project flow.
// Ported from the static mockup so behaviour matches exactly.

// Founding-member pricing unlocks only after this many verified projects.
export const MIN_PROJECTS_FOR_PREMIUM = 3

// Free accounts can hold at most this many projects; becoming a founding member
// removes the cap. Enforced in the add flow, the server action, and a DB trigger.
export const FREE_PROJECT_LIMIT = 3

// Per-field character caps for a project entry and its validator. The client
// enforces these with maxLength for a good UX; the server action re-checks them
// so an over-long value can't be sneaked in past the input.
export const FIELD_MAX = {
  title: 120,
  company: 120,
  description: 600,
  outcome: 300,
  vName: 80,
  vRole: 80,
  vEmail: 160,
  vLink: 300,
  vNote: 240,
} as const

export const NOW = new Date().getFullYear()
export const YEARS = Array.from({ length: NOW - 1999 }, (_, i) => String(NOW - i))

export const REL_OPTIONS = ['Manager', 'Founder', 'Client', 'Professor', 'Colleague / peer', 'Other']

const FREE_MAIL = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'proton.me', 'protonmail.com', 'live.com', 'aol.com',
]

export const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

export type BadgeTier = { kind: 'academic' | 'peer' | 'company'; label: string }

export function badgeTier(email: string): BadgeTier | null {
  const at = email.indexOf('@')
  if (at < 0 || !/\.[^@\s]+$/.test(email)) return null
  const d = email.slice(at + 1).toLowerCase()
  if (/(\.edu|\.ac\.[a-z]{2,}|\.edu\.[a-z]{2,})$/.test(d)) return { kind: 'academic', label: 'Academic verified' }
  if (FREE_MAIL.includes(d)) return { kind: 'peer', label: 'Peer verified' }
  return { kind: 'company', label: 'Company verified' }
}

export function periodLabel(s?: string | null, e?: string | null) {
  if (!s) return ''
  const end = e === 'Present' || !e ? 'Present' : e
  return s === end ? s : `${s}–${end}`
}

export function durationLabel(s?: string | null, e?: string | null) {
  if (!s) return ''
  const sy = +s
  const ey = e === 'Present' || !e ? NOW : +e
  const y = Math.max(0, ey - sy)
  return y <= 0 ? 'under a year' : `${y} yr${y > 1 ? 's' : ''}`
}

/** Year string ("2024" / "Present") <-> date column helpers. */
export function yearToStartDate(year: string): string | null {
  return year ? `${year}-01-01` : null
}
export function yearToEndDate(year: string): string | null {
  if (!year || year === 'Present') return null
  return `${year}-12-31`
}
export function dateToYear(d?: string | null): string {
  if (!d) return ''
  return d.slice(0, 4)
}
