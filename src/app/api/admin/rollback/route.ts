import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, canPublish } from '@/lib/auth-helpers'
import prisma from '@/lib/db'
import { Employee } from '@/types/employee'
import { employeeSnapshotSelect, toEmployeeData } from '@/lib/employee-data'

// POST - Rollback to a specific version
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canPublish(user)) {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const { versionId, author = user.name || 'Admin' } = await request.json()

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID required' }, { status: 400 })
    }

    const version = await prisma.version.findUnique({
      where: { versionId }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const snapshotEmployees = version.snapshot as unknown as Employee[]
    const backupId = `rollback-backup-${Date.now()}`

    await prisma.$transaction(async (tx) => {
      // Backup current state before rollback
      const currentSnapshot = await tx.employee.findMany({ select: employeeSnapshotSelect })

      await tx.version.create({
        data: {
          versionId: backupId,
          timestamp: new Date(),
          author,
          changeCount: 0,
          snapshot: currentSnapshot,
          description: `Backup before rollback to ${versionId}`
        }
      })

      // Replace all employees with snapshot
      await tx.employee.deleteMany()
      await tx.employee.createMany({
        data: snapshotEmployees.map(emp => ({
          id: emp.id,
          ...toEmployeeData(emp),
        }))
      })

      // Clear approved changes that would conflict with rolled-back state
      await tx.pendingChange.deleteMany({ where: { status: 'approved' } })
    }, { timeout: 30000 })

    return NextResponse.json({
      success: true,
      versionId,
      employeeCount: snapshotEmployees.length,
      backupId
    })
  } catch (error) {
    console.error('Rollback error:', error)
    return NextResponse.json({ error: 'Failed to rollback' }, { status: 500 })
  }
}
