import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, isSuperAdmin } from '@/lib/auth-helpers'
import prisma from '@/lib/db'

// GET - Get all allowed IPs (any authenticated admin)
export async function GET() {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedIPs = await prisma.allowedIP.findMany({
      orderBy: { addedAt: 'desc' }
    })

    const mapped = allowedIPs.map((record) => ({
      id: record.id,
      ip: record.ip,
      location: record.location,
      notes: record.notes,
      addedBy: record.addedBy,
      addedAt: record.addedAt.toISOString()
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Error fetching allowed IPs:', error)
    return NextResponse.json({ error: 'Failed to fetch allowed IPs' }, { status: 500 })
  }
}

// POST - Add a new allowed IP (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const { ip, location, notes } = await request.json()

    if (!ip || !location) {
      return NextResponse.json({ error: 'Missing required fields (ip, location)' }, { status: 400 })
    }

    // Validate IPv4 format
    const parts = ip.split('.')
    if (parts.length !== 4) {
      return NextResponse.json({ error: 'Invalid IPv4 format' }, { status: 400 })
    }
    const isValidIPv4 = parts.every((part: string) => {
      const num = parseInt(part, 10)
      return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part
    })
    if (!isValidIPv4) {
      return NextResponse.json({ error: 'Invalid IPv4 format' }, { status: 400 })
    }

    // Check for duplicate IP
    const existing = await prisma.allowedIP.findUnique({
      where: { ip }
    })

    if (existing) {
      return NextResponse.json({ error: 'This IP address is already allowed' }, { status: 400 })
    }

    const newIP = await prisma.allowedIP.create({
      data: {
        ip,
        location,
        notes: notes || null,
        addedBy: user.email || 'unknown',
        addedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      ip: {
        id: newIP.id,
        ip: newIP.ip,
        location: newIP.location,
        notes: newIP.notes,
        addedBy: newIP.addedBy,
        addedAt: newIP.addedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error adding allowed IP:', error)
    return NextResponse.json({ error: 'Failed to add allowed IP' }, { status: 500 })
  }
}

// DELETE - Remove an allowed IP by id (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'IP id is required as query parameter' }, { status: 400 })
    }

    const existing = await prisma.allowedIP.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'IP record not found' }, { status: 404 })
    }

    await prisma.allowedIP.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting allowed IP:', error)
    return NextResponse.json({ error: 'Failed to delete allowed IP' }, { status: 500 })
  }
}
