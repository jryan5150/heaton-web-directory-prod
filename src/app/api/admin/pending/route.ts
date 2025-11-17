import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { PendingChange } from '@/types/admin'
import { Employee } from '@/types/employee'

// Helper to convert Prisma model to PendingChange type
function mapToPendingChange(dbChange: {
  id: string
  type: string
  employeeId: string | null
  beforeData: unknown
  afterData: unknown
  status: string
  proposedBy: string
  proposedAt: Date
  approvedBy: string | null
  approvedAt: Date | null
  notes: string | null
}): PendingChange {
  return {
    id: dbChange.id,
    type: dbChange.type as 'add' | 'edit' | 'delete',
    employeeId: dbChange.employeeId || undefined,
    before: dbChange.beforeData as Employee | undefined,
    after: dbChange.afterData as Employee | undefined,
    status: dbChange.status as 'pending' | 'approved' | 'rejected',
    proposedBy: dbChange.proposedBy,
    proposedAt: dbChange.proposedAt.toISOString(),
    approvedBy: dbChange.approvedBy || undefined,
    approvedAt: dbChange.approvedAt?.toISOString(),
    notes: dbChange.notes || undefined,
  }
}

// GET - Get all pending changes
export async function GET() {
  try {
    const changes = await prisma.pendingChange.findMany({
      orderBy: { proposedAt: 'desc' }
    })
    return NextResponse.json(changes.map(mapToPendingChange))
  } catch (error) {
    console.error('Error fetching pending changes:', error)
    return NextResponse.json({ error: 'Failed to fetch pending changes' }, { status: 500 })
  }
}

// POST - Create new pending change
export async function POST(request: NextRequest) {
  try {
    const change: PendingChange = await request.json()

    const newChange = await prisma.pendingChange.create({
      data: {
        id: change.id || `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: change.type,
        employeeId: change.employeeId || null,
        beforeData: change.before ? (change.before as object) : undefined,
        afterData: change.after ? (change.after as object) : undefined,
        status: change.status || 'pending',
        proposedBy: change.proposedBy,
        proposedAt: change.proposedAt ? new Date(change.proposedAt) : new Date(),
        approvedBy: change.approvedBy || null,
        approvedAt: change.approvedAt ? new Date(change.approvedAt) : null,
        notes: change.notes || null,
      }
    })

    return NextResponse.json(mapToPendingChange(newChange), { status: 201 })
  } catch (error) {
    console.error('Error creating pending change:', error)
    return NextResponse.json({ error: 'Failed to create pending change' }, { status: 500 })
  }
}

// PATCH - Update pending change status
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, notes, approvedBy, approvedAt } = await request.json()

    const updatedChange = await prisma.pendingChange.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        approvedBy: approvedBy || undefined,
        approvedAt: approvedAt ? new Date(approvedAt) : undefined,
      }
    })

    return NextResponse.json(mapToPendingChange(updatedChange))
  } catch (error) {
    console.error('Error updating pending change:', error)
    return NextResponse.json({ error: 'Failed to update pending change' }, { status: 500 })
  }
}

// DELETE - Delete pending change
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.pendingChange.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pending change:', error)
    return NextResponse.json({ error: 'Failed to delete pending change' }, { status: 500 })
  }
}
