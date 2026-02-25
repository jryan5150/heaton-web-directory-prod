import { NextRequest, NextResponse } from 'next/server'
import { getAllEmployees, addEmployee, saveEmployees } from '@/lib/database'
import { getSessionFromCookie } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const employees = await getAllEmployees()
    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const newEmployee = await addEmployee(body)

    return NextResponse.json(newEmployee, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionFromCookie()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employees = await request.json()
    await saveEmployees(employees)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employees' }, { status: 500 })
  }
}