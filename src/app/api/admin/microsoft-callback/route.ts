import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-config'
import prisma from '@/lib/db'
import { setSessionCookie } from '@/lib/auth-helpers'
import { UserRole } from '@/types/admin'

/**
 * After Microsoft OIDC completes, next-auth redirects here.
 * This route reads the next-auth session to get the Microsoft user's email
 * and Entra Object ID, looks up the corresponding admin user in the database,
 * and mints our own admin-session JWT cookie.
 *
 * Only users pre-registered in the database are granted access.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL('/admin/login?error=NoSession', request.url)
      )
    }

    const microsoftEmail = session.user.email
    const microsoftId = (session.user as Record<string, unknown>).microsoftId as string | undefined

    // Look up user by email or by linked Microsoft ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: microsoftEmail, mode: 'insensitive' } },
          ...(microsoftId ? [{ microsoftId }] : []),
        ],
      },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/admin/login?error=NotRegistered', request.url)
      )
    }

    // Link the Entra Object ID if not already stored — enables future lookups
    // even if the user's email changes in Microsoft 365
    if (microsoftId && !user.microsoftId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { microsoftId },
      })
    }

    // Mint our own admin session cookie
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    })

    return NextResponse.redirect(new URL('/admin', request.url))
  } catch (error) {
    console.error('Microsoft callback error:', error)
    return NextResponse.redirect(
      new URL('/admin/login?error=CallbackError', request.url)
    )
  }
}
