import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth-helpers'

// GET - Get activity log
export async function GET() {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Activity log not yet migrated to database — return empty for now
    return NextResponse.json([])
  } catch (error) {
    console.error('Error reading activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}
