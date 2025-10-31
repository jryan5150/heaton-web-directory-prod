import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ACTIVITY_LOG_FILE = path.join(process.cwd(), 'data', 'activity-log.json')

// GET - Get activity log
export async function GET() {
  try {
    if (!fs.existsSync(ACTIVITY_LOG_FILE)) {
      return NextResponse.json([])
    }

    const log = JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf-8'))
    return NextResponse.json(log)
  } catch (error) {
    console.error('Error reading activity log:', error)
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 })
  }
}
