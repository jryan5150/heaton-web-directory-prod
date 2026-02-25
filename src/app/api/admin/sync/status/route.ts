/**
 * GET /api/admin/sync/status
 *
 * Returns sync status overview:
 * - Last 10 sync logs
 * - Current SyncMapping entry count
 * - Last sync timestamp
 *
 * Requires admin session.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionFromCookie } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [recentLogs, mappingCount] = await Promise.all([
      prisma.syncLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
      prisma.syncMapping.count(),
    ])

    const lastSync = recentLogs.length > 0 ? recentLogs[0] : null

    return NextResponse.json({
      lastSyncTimestamp: lastSync?.timestamp.toISOString() ?? null,
      mappingCount,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        source: log.source,
        totalRows: log.totalRows,
        matched: log.matched,
        created: log.created,
        updated: log.updated,
        skipped: log.skipped,
        errors: log.errors,
        details: log.details,
        triggeredBy: log.triggeredBy,
      })),
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
}
