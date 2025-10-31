import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie, canPublish } from '@/lib/auth-helpers'
import fs from 'fs'
import path from 'path'
import { Employee } from '@/types/employee'
import { ActivityLogEntry } from '@/types/admin'

const EMPLOYEES_FILE = path.join(process.cwd(), 'data', 'employees.json')
const ACTIVITY_LOG_FILE = path.join(process.cwd(), 'data', 'activity-log.json')
const VERSIONS_DIR = path.join(process.cwd(), 'data', 'versions')

function writeEmployees(employees: Employee[]) {
  fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2))
}

function logActivity(entry: ActivityLogEntry) {
  let log: ActivityLogEntry[] = []
  if (fs.existsSync(ACTIVITY_LOG_FILE)) {
    log = JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf-8'))
  }
  log.unshift(entry)
  if (log.length > 100) {
    log = log.slice(0, 100)
  }
  fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify(log, null, 2))
}

// POST - Rollback to a specific version
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

    const { versionId, author = user.name || 'Admin' } = await request.json()

    if (!versionId) {
      return NextResponse.json({ error: 'Version ID required' }, { status: 400 })
    }

    // Find and load the version
    const versionFile = path.join(VERSIONS_DIR, `${versionId}.json`)

    if (!fs.existsSync(versionFile)) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf-8'))

    // Create a backup of current state before rollback
    const currentEmployees = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf-8'))
    const backupId = `rollback-backup-${Date.now()}`
    const backupFile = path.join(VERSIONS_DIR, `${backupId}.json`)
    fs.writeFileSync(backupFile, JSON.stringify({
      id: backupId,
      timestamp: new Date().toISOString(),
      employeeCount: currentEmployees.length,
      changes: [`Backup before rollback to ${versionId}`],
      employees: currentEmployees
    }, null, 2))

    // Restore the version
    writeEmployees(versionData.employees)

    // Log activity
    logActivity({
      id: `activity-${Date.now()}`,
      action: 'rollback',
      details: `Rolled back to version ${versionId} (${versionData.employeeCount} employees)`,
      author,
      timestamp: new Date().toISOString(),
      type: 'rollback'
    })

    return NextResponse.json({
      success: true,
      versionId,
      employeeCount: versionData.employeeCount,
      backupId
    })
  } catch (error) {
    console.error('Rollback error:', error)
    return NextResponse.json({ error: 'Failed to rollback' }, { status: 500 })
  }
}
