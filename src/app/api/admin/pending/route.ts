import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PendingChange } from '@/types/admin'

const PENDING_FILE = path.join(process.cwd(), 'data', 'pending-changes.json')

function readPendingChanges(): PendingChange[] {
  try {
    if (!fs.existsSync(PENDING_FILE)) {
      return []
    }
    const data = fs.readFileSync(PENDING_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading pending changes:', error)
    return []
  }
}

function writePendingChanges(changes: PendingChange[]) {
  fs.writeFileSync(PENDING_FILE, JSON.stringify(changes, null, 2))
}

// GET - Get all pending changes
export async function GET() {
  try {
    const changes = readPendingChanges()
    return NextResponse.json(changes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pending changes' }, { status: 500 })
  }
}

// POST - Create new pending change
export async function POST(request: NextRequest) {
  try {
    const change: PendingChange = await request.json()

    // Add ID and timestamp if not provided
    if (!change.id) {
      change.id = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    if (!change.proposedAt) {
      change.proposedAt = new Date().toISOString()
    }
    if (!change.status) {
      change.status = 'pending'
    }

    const changes = readPendingChanges()
    changes.push(change)
    writePendingChanges(changes)

    return NextResponse.json(change, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create pending change' }, { status: 500 })
  }
}

// PATCH - Update pending change status
export async function PATCH(request: NextRequest) {
  try {
    const { id, status, notes } = await request.json()

    const changes = readPendingChanges()
    const changeIndex = changes.findIndex(c => c.id === id)

    if (changeIndex === -1) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    changes[changeIndex].status = status
    if (notes) {
      changes[changeIndex].notes = notes
    }

    writePendingChanges(changes)

    return NextResponse.json(changes[changeIndex])
  } catch (error) {
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

    const changes = readPendingChanges()
    const filtered = changes.filter(c => c.id !== id)

    if (filtered.length === changes.length) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    writePendingChanges(filtered)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete pending change' }, { status: 500 })
  }
}
