import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import fs from 'fs'
import path from 'path'
import { User } from '@/types/admin'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

function readUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
}

function writeUsers(users: User[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

// GET - Get all users (superadmin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const users = readUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error reading users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST - Add new user (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const { email, name, role } = await request.json()

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (role !== 'superadmin' && role !== 'approver') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const users = readUsers()

    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role,
      addedAt: new Date().toISOString(),
      addedBy: session.user.email || 'unknown'
    }

    users.push(newUser)
    writeUsers(users)

    return NextResponse.json({ success: true, user: newUser })
  } catch (error) {
    console.error('Error adding user:', error)
    return NextResponse.json({ error: 'Failed to add user' }, { status: 500 })
  }
}

// DELETE - Remove user (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden - Superadmin only' }, { status: 403 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const users = readUsers()
    const userToDelete = users.find(u => u.id === id)

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting yourself
    if (userToDelete.email === session.user.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const updatedUsers = users.filter(u => u.id !== id)
    writeUsers(updatedUsers)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
