import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './lib/auth-helpers'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const user = await getSessionFromRequest(request)

    if (!user) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Remove password protection from main directory
  // (Public access to /)

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
