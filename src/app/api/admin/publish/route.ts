import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, canPublish } from '@/lib/auth-helpers'
import fs from 'fs'
import path from 'path'
import { Employee } from '@/types/employee'
import { PendingChange, ActivityLogEntry } from '@/types/admin'

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json')
const PENDING_FILE = path.join(process.cwd(), 'data', 'pending-changes.json')
const ACTIVITY_LOG_FILE = path.join(process.cwd(), 'data', 'activity-log.json')
const VERSIONS_DIR = path.join(process.cwd(), 'data', 'versions')

function readEmployees(): Employee[] {
  const data = fs.readFileSync(EMPLOYEES_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeEmployees(employees: Employee[]) {
  fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2))
}

function readPendingChanges(): PendingChange[] {
  if (!fs.existsSync(PENDING_FILE)) return []
  const data = fs.readFileSync(PENDING_FILE, 'utf-8')
  return JSON.parse(data)
}

function writePendingChanges(changes: PendingChange[]) {
  fs.writeFileSync(PENDING_FILE, JSON.stringify(changes, null, 2))
}

function createVersionSnapshot(employees: Employee[], changes: PendingChange[]) {
  const timestamp = new Date().toISOString()
  const versionId = `v-${Date.now()}`
  const filename = `${versionId}.json`
  const filepath = path.join(VERSIONS_DIR, filename)

  const versionData = {
    id: versionId,
    timestamp,
    employeeCount: employees.length,
    changes: changes.map(c => `${c.type}: ${c.after?.firstName} ${c.after?.lastName || ''}`),
    employees
  }

  fs.writeFileSync(filepath, JSON.stringify(versionData, null, 2))
  return versionId
}

function logActivity(entry: ActivityLogEntry) {
  let log: ActivityLogEntry[] = []
  if (fs.existsSync(ACTIVITY_LOG_FILE)) {
    log = JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf-8'))
  }
  log.unshift(entry) // Add to beginning
  // Keep only last 100 entries
  if (log.length > 100) {
    log = log.slice(0, 100)
  }
  fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify(log, null, 2))
}

// POST - Publish approved changes to production
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const user = await getSessionFromCookie()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canPublish(user)) {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const { author = user.name || 'Admin' } = await request.json()

    // Get approved changes
    const allChanges = readPendingChanges()
    const approvedChanges = allChanges.filter(c => c.status === 'approved')

    if (approvedChanges.length === 0) {
      return NextResponse.json({
        error: 'No approved changes to publish'
      }, { status: 400 })
    }

    // Load current employees
    let employees = readEmployees()

    // Create version snapshot BEFORE applying changes
    const versionId = createVersionSnapshot(employees, approvedChanges)

    // Apply changes
    for (const change of approvedChanges) {
      switch (change.type) {
        case 'add':
          if (change.after) {
            employees.push(change.after)
          }
          break

        case 'edit':
          if (change.employeeId && change.after) {
            const index = employees.findIndex(e => e.id === change.employeeId)
            if (index !== -1) {
              employees[index] = change.after
            }
          }
          break

        case 'delete':
          if (change.employeeId) {
            employees = employees.filter(e => e.id !== change.employeeId)
          }
          break
      }
    }

    // Write updated employees to production
    writeEmployees(employees)

    // Remove approved changes from pending
    const remainingChanges = allChanges.filter(c => c.status !== 'approved')
    writePendingChanges(remainingChanges)

    // Log activity
    logActivity({
      id: `activity-${Date.now()}`,
      action: 'publish',
      details: `Published ${approvedChanges.length} changes (${versionId})`,
      author,
      timestamp: new Date().toISOString(),
      type: 'publish'
    })

    return NextResponse.json({
      success: true,
      publishedCount: approvedChanges.length,
      versionId,
      totalEmployees: employees.length
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({
      error: 'Failed to publish changes'
    }, { status: 500 })
  }
}
