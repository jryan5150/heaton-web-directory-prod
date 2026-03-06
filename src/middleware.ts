import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './lib/auth-helpers'

// --- IP Allow List Cache ---
let cachedIPs: string[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getAllowedIPs(requestUrl: string): Promise<string[]> {
  const now = Date.now()

  if (cachedIPs && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedIPs
  }

  try {
    const origin = new URL(requestUrl).origin
    const response = await fetch(
      `${origin}/api/internal/allowed-ips`,
      {
        headers: {
          'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
        },
      }
    )

    if (!response.ok) {
      console.error(
        `Failed to fetch allowed IPs: ${response.status} ${response.statusText}`
      )
      // If we have stale cached data, use it as fallback
      if (cachedIPs) return cachedIPs
      return []
    }

    const data = await response.json()
    cachedIPs = data.ips ?? []
    cacheTimestamp = now
    return cachedIPs!
  } catch (error) {
    console.error('Error fetching allowed IPs:', error)
    // Fallback to stale cache if available
    if (cachedIPs) return cachedIPs
    return []
  }
}

function getClientIP(request: NextRequest): string | null {
  // Vercel sets x-forwarded-for; fall back to x-real-ip
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; first is the client
    return forwarded.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip')
}

function blockedResponse(): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Restricted</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8fafc;
      color: #1e293b;
    }
    .container {
      text-align: center;
      max-width: 480px;
      padding: 2rem;
    }
    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    p {
      color: #64748b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔒</div>
    <h1>Access Restricted</h1>
    <p>This directory is only available from Heaton Eye office networks. If you believe this is an error, please contact your IT administrator.</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 403,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/**
 * Returns true if the route is a public-facing route that should be IP-restricted.
 * Public routes: /, /heaton-directory/*, /api/employees (GET only handled in main logic)
 */
function isPublicRoute(pathname: string): boolean {
  // Root page
  if (pathname === '/') return true

  // Directory pages
  if (pathname.startsWith('/heaton-directory')) return true

  // Public employee API (GET) — restrict IPs here; POST/PUT have auth checks
  if (pathname === '/api/employees') return true

  return false
}

/**
 * Returns true if the route should bypass IP checks entirely.
 * Admin portal, admin API, internal API, static assets, and Next.js internals.
 */
function isExemptFromIPCheck(pathname: string): boolean {
  // Admin portal — protected by session auth, accessible from any IP
  if (pathname.startsWith('/admin')) return true

  // Admin API routes — protected by their own auth
  if (pathname.startsWith('/api/admin')) return true

  // NextAuth routes — handles Microsoft SSO OIDC flow
  if (pathname.startsWith('/api/auth')) return true

  // Internal API routes — protected by internal secret
  if (pathname.startsWith('/api/internal')) return true

  // Next.js internals and static assets
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname === '/robots.txt') return true
  if (pathname === '/sitemap.xml') return true

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- IP Restriction for Public Routes ---
  if (!isExemptFromIPCheck(pathname) && isPublicRoute(pathname)) {
    const clientIP = getClientIP(request)

    if (clientIP) {
      const allowedIPs = await getAllowedIPs(request.url)

      // If no IPs configured, allow all traffic (fail-open for initial setup)
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        return blockedResponse()
      }
    }
    // If we can't determine the client IP, allow the request through
    // (better to fail open than block legitimate users)
  }

  // --- Admin Auth Protection ---
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const user = await getSessionFromRequest(request)

    if (!user) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
