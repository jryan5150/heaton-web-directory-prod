import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple password protection
const DIRECTORY_PASSWORD = process.env.DIRECTORY_PASSWORD || 'heaton2024'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect heaton-directory and apple-demo routes
  if (pathname.startsWith('/heaton-directory') || pathname.startsWith('/apple-demo')) {
    // Check if user is authenticated
    const authCookie = request.cookies.get('directory-auth')

    if (authCookie?.value !== 'authenticated') {
      // Redirect to login page
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/heaton-directory/:path*', '/apple-demo/:path*']
}
