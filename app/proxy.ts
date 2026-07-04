import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16 renamed the `middleware` convention to `proxy`, which defaults to
// the Node.js runtime. That matters here: @supabase/ssr pulls in code that
// references `__dirname`, which is undefined on the Edge runtime and crashed
// every request with MIDDLEWARE_INVOCATION_FAILED.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // verifiedwork.co is the canonical home for everything - the marketing
  // landing page and the app both run here natively (no cross-domain hop to
  // *.vercel.app).

  // Public marketing pages (landing, blog, legal, assets) need no auth work -
  // skip the Supabase round-trip entirely so they stay fast.
  if (
    path === '/' ||
    path.startsWith('/blog') ||
    path.startsWith('/assets') ||
    /\.(html|txt|xml|ico|png|svg|jpe?g|gif|webp)$/i.test(path)
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser()

  // getUser() may have refreshed the session and queued new auth cookies on
  // supabaseResponse. A plain NextResponse.redirect would drop them, losing the
  // refreshed session and bouncing the user on the next request (worst on
  // browsers with stricter cookie handling). Carry the cookies onto the
  // redirect instead, exactly as the Supabase SSR guide requires.
  const redirectTo = (dest: string) => {
    const res = NextResponse.redirect(new URL(dest, request.url))
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  // Redirect unauthenticated users away from the app's protected routes
  if (!user && (path.startsWith('/dashboard') || path.startsWith('/onboarding') || path.startsWith('/settings') || path.startsWith('/add'))) {
    return redirectTo('/login')
  }

  // Redirect authenticated users away from /login
  if (user && request.nextUrl.pathname === '/login') {
    return redirectTo('/dashboard')
  }

  // Never let the browser cache signed-in pages. Without this the back button
  // (bfcache) can resurrect the dashboard/settings after sign-out or account
  // deletion, making it look like neither "stuck".
  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/settings') ||
    path.startsWith('/add')
  ) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
