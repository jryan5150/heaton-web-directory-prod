/**
 * /api/admin/sync/mappings
 *
 * GET    — Return all SyncMapping entries with employee name join
 * POST   — Create a new mapping { nextivaEmail, employeeId } (superadmin)
 * DELETE — Remove a mapping by id (superadmin)
 *
 * All methods require admin session; POST/DELETE require superadmin role.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionFromCookie, isSuperAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mappings = await prisma.syncMapping.findMany({
      orderBy: { addedAt: 'desc' },
    })

    // Batch-fetch employee names for all mapped IDs
    const employeeIds = mappings.map((m) => m.employeeId)
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, firstName: true, lastName: true },
    })

    const employeeMap = new Map(
      employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`])
    )

    return NextResponse.json(
      mappings.map((m) => ({
        id: m.id,
        nextivaEmail: m.nextivaEmail,
        employeeId: m.employeeId,
        employeeName: employeeMap.get(m.employeeId) ?? '(employee not found)',
        addedBy: m.addedBy,
        addedAt: m.addedAt.toISOString(),
        notes: m.notes,
      }))
    )
  } catch (error) {
    console.error('Error fetching sync mappings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync mappings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden — Superadmin only' },
        { status: 403 }
      )
    }

    const { nextivaEmail, employeeId, notes } = await request.json()

    if (!nextivaEmail || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields: nextivaEmail, employeeId' },
        { status: 400 }
      )
    }

    // Validate that the employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check for duplicate mapping
    const existing = await prisma.syncMapping.findUnique({
      where: { nextivaEmail: nextivaEmail.toLowerCase().trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A mapping for this Nextiva email already exists' },
        { status: 409 }
      )
    }

    const mapping = await prisma.syncMapping.create({
      data: {
        nextivaEmail: nextivaEmail.toLowerCase().trim(),
        employeeId,
        addedBy: user.email,
        notes: notes || null,
      },
    })

    return NextResponse.json(
      {
        id: mapping.id,
        nextivaEmail: mapping.nextivaEmail,
        employeeId: mapping.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        addedBy: mapping.addedBy,
        addedAt: mapping.addedAt.toISOString(),
        notes: mapping.notes,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sync mapping:', error)
    return NextResponse.json(
      { error: 'Failed to create sync mapping' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden — Superadmin only' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Mapping ID required (pass as ?id=...)' },
        { status: 400 }
      )
    }

    const mapping = await prisma.syncMapping.findUnique({ where: { id } })
    if (!mapping) {
      return NextResponse.json(
        { error: 'Mapping not found' },
        { status: 404 }
      )
    }

    await prisma.syncMapping.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sync mapping:', error)
    return NextResponse.json(
      { error: 'Failed to delete sync mapping' },
      { status: 500 }
    )
  }
}
