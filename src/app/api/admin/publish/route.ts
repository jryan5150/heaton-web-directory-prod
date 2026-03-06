import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, canPublish } from '@/lib/auth-helpers'
import prisma from '@/lib/db'
import { Employee } from '@/types/employee'
import { employeeSnapshotSelect, toEmployeeData } from '@/lib/employee-data'

// POST - Publish approved changes to production
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canPublish(user)) {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const { author = user.name || 'Admin' } = await request.json()

    const approvedChanges = await prisma.pendingChange.findMany({
      where: { status: 'approved' }
    })

    if (approvedChanges.length === 0) {
      return NextResponse.json({
        error: 'No approved changes to publish'
      }, { status: 400 })
    }

    const versionId = `v-${Date.now()}`
    let skippedCount = 0

    await prisma.$transaction(async (tx) => {
      // Snapshot current state before applying changes
      const snapshotData = await tx.employee.findMany({ select: employeeSnapshotSelect })

      await tx.version.create({
        data: {
          versionId,
          timestamp: new Date(),
          author,
          changeCount: approvedChanges.length,
          snapshot: snapshotData,
          description: `Published ${approvedChanges.length} changes`
        }
      })

      for (const change of approvedChanges) {
        const afterData = change.afterData as Employee | null

        switch (change.type) {
          case 'add':
            if (afterData) {
              await tx.employee.create({
                data: {
                  id: afterData.id || undefined,
                  ...toEmployeeData(afterData),
                }
              })
            }
            break

          case 'edit':
            if (change.employeeId && afterData) {
              const exists = await tx.employee.findUnique({ where: { id: change.employeeId } })
              if (exists) {
                await tx.employee.update({
                  where: { id: change.employeeId },
                  data: toEmployeeData(afterData),
                })
              } else {
                console.warn(`Publish: skipping edit for missing employee ${change.employeeId}`)
                skippedCount++
              }
            }
            break

          case 'delete':
            if (change.employeeId) {
              const exists = await tx.employee.findUnique({ where: { id: change.employeeId } })
              if (exists) {
                await tx.employee.delete({ where: { id: change.employeeId } })
              } else {
                console.warn(`Publish: skipping delete for missing employee ${change.employeeId}`)
                skippedCount++
              }
            }
            break
        }
      }

      await tx.pendingChange.deleteMany({ where: { status: 'approved' } })
    }, { timeout: 30000 })

    const totalEmployees = await prisma.employee.count()

    return NextResponse.json({
      success: true,
      publishedCount: approvedChanges.length - skippedCount,
      skippedCount,
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
