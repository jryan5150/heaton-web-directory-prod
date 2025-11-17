import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, canPublish } from '@/lib/auth-helpers'
import prisma from '@/lib/db'
import { Employee } from '@/types/employee'

// POST - Publish approved changes to production
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

    const { author = user.name || 'Admin' } = await request.json()

    // Get approved changes from database
    const approvedChanges = await prisma.pendingChange.findMany({
      where: { status: 'approved' }
    })

    if (approvedChanges.length === 0) {
      return NextResponse.json({
        error: 'No approved changes to publish'
      }, { status: 400 })
    }

    // Load current employees from database
    const currentEmployees = await prisma.employee.findMany()
    const employeeMap = new Map(currentEmployees.map(e => [e.id, e]))

    // Create version snapshot BEFORE applying changes
    const versionId = `v-${Date.now()}`
    const snapshotData = currentEmployees.map(emp => ({
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

    await prisma.version.create({
      data: {
        versionId,
        timestamp: new Date(),
        author,
        changeCount: approvedChanges.length,
        snapshot: snapshotData,
        description: `Published ${approvedChanges.length} changes`
      }
    })

    // Apply changes to database
    for (const change of approvedChanges) {
      const afterData = change.afterData as Employee | null

      switch (change.type) {
        case 'add':
          if (afterData) {
            await prisma.employee.create({
              data: {
                id: afterData.id,
                firstName: afterData.firstName,
                lastName: afterData.lastName,
                email: afterData.email || null,
                extension: afterData.extension || null,
                phoneNumber: afterData.phoneNumber || null,
                did: afterData.did || null,
                location: afterData.location,
                team: afterData.team || '',
                title: afterData.title || null,
                jobTitle: afterData.jobTitle || null,
                department: afterData.department || null,
                photoUrl: afterData.photoUrl || null,
                avatarUrl: afterData.avatarUrl || null,
              }
            })
          }
          break

        case 'edit':
          if (change.employeeId && afterData) {
            await prisma.employee.update({
              where: { id: change.employeeId },
              data: {
                firstName: afterData.firstName,
                lastName: afterData.lastName,
                email: afterData.email || null,
                extension: afterData.extension || null,
                phoneNumber: afterData.phoneNumber || null,
                did: afterData.did || null,
                location: afterData.location,
                team: afterData.team || '',
                title: afterData.title || null,
                jobTitle: afterData.jobTitle || null,
                department: afterData.department || null,
                photoUrl: afterData.photoUrl || null,
                avatarUrl: afterData.avatarUrl || null,
              }
            })
          }
          break

        case 'delete':
          if (change.employeeId) {
            await prisma.employee.delete({
              where: { id: change.employeeId }
            })
          }
          break
      }
    }

    // Remove approved changes from pending
    await prisma.pendingChange.deleteMany({
      where: { status: 'approved' }
    })

    // Get updated employee count
    const totalEmployees = await prisma.employee.count()

    return NextResponse.json({
      success: true,
      publishedCount: approvedChanges.length,
      versionId,
      totalEmployees
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({
      error: 'Failed to publish changes'
    }, { status: 500 })
  }
}
