import { signOut } from '@/lib/auth-actions'

// A plain form posting to a server action: works on the first click (no
// dependency on client hydration) and clears the session server-side.
export default function AccountActions() {
  return (
    <form action={signOut}>
      <button className="btn btn-secondary btn-sm pill" type="submit">
        Sign out
      </button>
    </form>
  )
}
