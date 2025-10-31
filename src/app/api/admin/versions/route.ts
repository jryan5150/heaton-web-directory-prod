import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const VERSIONS_DIR = path.join(process.cwd(), 'data', 'versions')

// GET - Get all version history
export async function GET() {
  try {
    if (!fs.existsSync(VERSIONS_DIR)) {
      return NextResponse.json([])
    }

    const files = fs.readdirSync(VERSIONS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse() // Newest first

    const versions = files.map(file => {
      const filepath = path.join(VERSIONS_DIR, file)
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      // Return metadata only, not full employee data
      return {
        id: data.id,
        timestamp: data.timestamp,
        employeeCount: data.employeeCount,
        changes: data.changes
      }
    })

    return NextResponse.json(versions)
  } catch (error) {
    console.error('Error reading versions:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}
