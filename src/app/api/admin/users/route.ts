import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, isSuperAdmin, hashPassword } from '@/lib/auth-helpers'
import prisma from '@/lib/db'

// GET - Get all users (superadmin only)
export async function GET() {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { addedAt: 'desc' }
    })

    // Map to expected format
    const mappedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      passwordHash: u.passwordHash,
      addedAt: u.addedAt.toISOString(),
      addedBy: u.addedBy
    }))

    return NextResponse.json(mappedUsers)
  } catch (error) {
    console.error('Error reading users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST - Add new user (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const { email, name, role, password } = await request.json()

    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields (email, name, role, password)' }, { status: 400 })
    }

    if (role !== 'superadmin' && role !== 'approver' && role !== 'editor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash the password
    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        addedAt: new Date(),
        addedBy: user.email || 'unknown'
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        passwordHash: newUser.passwordHash,
        addedAt: newUser.addedAt.toISOString(),
        addedBy: newUser.addedBy
      }
    })
  } catch (error) {
    console.error('Error adding user:', error)
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 })
  }
}

// DELETE - Remove user (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (userToDelete.email === user.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
