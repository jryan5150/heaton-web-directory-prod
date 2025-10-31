import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types/admin'

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT Session Management
export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SESSION_SECRET)

  return token
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, SESSION_SECRET)
    return verified.payload.user as SessionUser
  } catch (error) {
    return null
  }
}

// Cookie Management
export async function setSessionCookie(user: SessionUser) {
  const token = await createSession(user)
  const cookieStore = await cookies()

  cookieStore.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/'
  })
}

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-session')

  if (!token) {
    return null
  }

  return verifySession(token.value)
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-session')
}

// Middleware helper
export function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get('admin-session')

  if (!token) {
    return Promise.resolve(null)
  }

  return verifySession(token.value)
}

// Role checking
export function hasRole(user: SessionUser | null, role: UserRole | UserRole[]): boolean {
  if (!user) return false

  if (Array.isArray(role)) {
    return role.includes(user.role)
  }

  return user.role === role
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return hasRole(user, 'superadmin')
}

export function canApprove(user: SessionUser | null): boolean {
  return hasRole(user, ['superadmin', 'approver'])
}

export function canPublish(user: SessionUser | null): boolean {
  return hasRole(user, 'superadmin')
}
