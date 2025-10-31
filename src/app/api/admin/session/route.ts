import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
