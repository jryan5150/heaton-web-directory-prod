import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { User } from '@/types/admin'
import { verifyPassword, setSessionCookie } from '@/lib/auth-helpers'

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

function getUsers(): User[] {
  if (!fs.existsSync(USERS_FILE)) {
    return []
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const users = getUsers()
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
