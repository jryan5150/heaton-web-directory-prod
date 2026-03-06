import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionFromCookie } from '@/lib/auth-helpers'

// GET - Get all version history
export async function GET() {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use raw query to get snapshot array length without fetching full snapshot data
    const versions = await prisma.$queryRaw<Array<{
      versionId: string
      timestamp: Date
      author: string
      changeCount: number
      description: string | null
      employeeCount: number
    }>>`
      SELECT "versionId", timestamp, author, "changeCount", description,
             jsonb_array_length(snapshot::jsonb) as "employeeCount"
      FROM "Version"
      ORDER BY timestamp DESC
    `

    const mappedVersions = versions.map(v => ({
      id: v.versionId,
      timestamp: v.timestamp instanceof Date ? v.timestamp.toISOString() : v.timestamp,
      author: v.author,
      changeCount: Number(v.changeCount),
      employeeCount: Number(v.employeeCount),
      description: v.description,
    }))

    return NextResponse.json(mappedVersions)
  } catch (error) {
    console.error('Error reading versions:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}
