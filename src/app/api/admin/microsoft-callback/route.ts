import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-config'
import prisma from '@/lib/db'
import { setSessionCookie } from '@/lib/auth-helpers'
import { UserRole } from '@/types/admin'

/**
 * After Microsoft SSO completes, next-auth redirects here.
 * This route reads the next-auth session to get the Microsoft user info,
 * looks up the user in our DB, creates our own JWT session cookie
 * (same as email/password login), and redirects to /admin.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the next-auth session (contains Microsoft profile data)
    const session = await auth()

    if (!session?.user?.email) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('error', 'NoSession')
      return NextResponse.redirect(loginUrl)
    }

    // Look up the user in our User table by email (case-insensitive)
    const dbUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: session.user.email,
          mode: 'insensitive',
        },
      },
    })

    if (!dbUser) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('error', 'NotRegistered')
      return NextResponse.redirect(loginUrl)
    }

    // Update microsoftId if not already set
    const microsoftId = session.microsoftId
    if (microsoftId && !dbUser.microsoftId) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { microsoftId },
      })
    }

    // Create our JWT session cookie (same as email/password login)
    await setSessionCookie({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
    })

    // Redirect to admin dashboard
    return NextResponse.redirect(new URL('/admin', request.url))
  } catch (error) {
    console.error('Microsoft callback error:', error)
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('error', 'CallbackError')
    return NextResponse.redirect(loginUrl)
  }
}
