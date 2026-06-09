// Pure helpers shared by the dashboard and the add-project flow.
// Ported from the static mockup so behaviour matches exactly.

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
