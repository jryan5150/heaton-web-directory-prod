import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import fs from 'fs'
import path from 'path'
import { User } from '@/types/admin'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

function getAuthorizedUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
}

// GET - Get current user with role
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is authorized and get their role
    const authorizedUsers = getAuthorizedUsers()
    const authorizedUser = authorizedUsers.find(u => u.email === session.user.email)

    if (!authorizedUser) {
      return NextResponse.json({ error: 'User not authorized' }, { status: 403 })
    }

    return NextResponse.json({
      id: authorizedUser.id,
      email: authorizedUser.email,
      name: authorizedUser.name,
      role: authorizedUser.role
    })
  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json({ error: 'Failed to get user info' }, { status: 500 })
  }
}
