import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Get all version history
export async function GET() {
  try {
    const versions = await prisma.version.findMany({
      orderBy: { timestamp: 'desc' },
      select: {
        versionId: true,
        timestamp: true,
        author: true,
        changeCount: true,
        description: true,
        // Don't include snapshot to reduce payload
      }
    })

    // Map to expected format
    const mappedVersions = versions.map(v => ({
      id: v.versionId,
      timestamp: v.timestamp.toISOString(),
      author: v.author,
      changeCount: v.changeCount,
      description: v.description
    }))

    return NextResponse.json(mappedVersions)
  } catch (error) {
    console.error('Error reading versions:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}
