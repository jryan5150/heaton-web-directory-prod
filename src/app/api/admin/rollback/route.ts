import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, canPublish } from '@/lib/auth-helpers'
import prisma from '@/lib/db'
import { Employee } from '@/types/employee'

// POST - Rollback to a specific version
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
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

    // Find the version in database
    const version = await prisma.version.findFirst({
      where: { versionId }
    })

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Get current employees for backup
    const currentEmployees = await prisma.employee.findMany()
    const currentSnapshot = currentEmployees.map(emp => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      extension: emp.extension,
      phoneNumber: emp.phoneNumber,
      did: emp.did,
      location: emp.location,
      team: emp.team,
      title: emp.title,
      jobTitle: emp.jobTitle,
      department: emp.department,
      photoUrl: emp.photoUrl,
      avatarUrl: emp.avatarUrl,
    }))

    // Create a backup version before rollback
    const backupId = `rollback-backup-${Date.now()}`
    await prisma.version.create({
      data: {
        versionId: backupId,
        timestamp: new Date(),
        author,
        changeCount: 0,
        snapshot: currentSnapshot,
        description: `Backup before rollback to ${versionId}`
      }
    })

    // Get employees from the version snapshot
    const snapshotEmployees = version.snapshot as unknown as Employee[]

    // Replace all employees with snapshot data using transaction
    await prisma.$transaction([
      prisma.employee.deleteMany(),
      ...snapshotEmployees.map(emp => prisma.employee.create({
        data: {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email || null,
          extension: emp.extension || null,
          phoneNumber: emp.phoneNumber || null,
          did: emp.did || null,
          location: emp.location,
          team: emp.team || '',
          title: emp.title || null,
          jobTitle: emp.jobTitle || null,
          department: emp.department || null,
          photoUrl: emp.photoUrl || null,
          avatarUrl: emp.avatarUrl || null,
        }
      }))
    ])

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
