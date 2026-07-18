import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const PUBLIC_PATHS = ['/login']

export async function proxy(request) {
  const { pathname } = request.nextUrl

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Always allow auth API
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const session = await getSession()

  // Not authenticated at all → redirect to login
  if (!session?.authenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { role } = session

  // Super admin routes — only super admin may access
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (role !== 'superadmin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Seller-only routes — super admin should not use the seller app
  if (role === 'superadmin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden — use admin routes' }, { status: 403 })
    }
    // Redirect super admin away from seller pages
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Seller is active check is done at login, so just pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)'],
}
