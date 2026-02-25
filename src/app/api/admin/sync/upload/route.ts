/**
 * POST /api/admin/sync/upload
 *
 * Accepts a Nextiva CSV file and runs it through the sync engine.
 *
 * Auth: Either a valid admin session cookie OR a Bearer token matching
 * SYNC_SECRET env var (for GitHub Actions automated uploads).
 *
 * Input:
 *   - multipart/form-data with a "file" field (manual upload from admin UI)
 *   - OR raw body with Content-Type: text/csv (automated upload)
 */

import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { getSessionFromCookie, verifySession } from '@/lib/auth-helpers'
import { runNextivaSync, type NextivaCSVRow } from '@/lib/nextiva-sync'

async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean
  triggeredBy: string
  source: 'manual' | 'automated'
}> {
  // Try session cookie first (admin portal uploads)
  const sessionUser = await getSessionFromCookie()
  if (sessionUser) {
    return {
      authenticated: true,
      triggeredBy: sessionUser.email,
      source: 'manual',
    }
  }

  // Try Bearer token (GitHub Actions / automated)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const syncSecret = process.env.SYNC_SECRET

    if (!syncSecret) {
      console.error('SYNC_SECRET env var not configured')
      return { authenticated: false, triggeredBy: '', source: 'automated' }
    }

    // Check if token is the sync secret (for simple API key auth)
    if (token === syncSecret) {
      return {
        authenticated: true,
        triggeredBy: 'github-actions',
        source: 'automated',
      }
    }

    // Also try verifying as a JWT session token (for flexibility)
    const jwtUser = await verifySession(token)
    if (jwtUser) {
      return {
        authenticated: true,
        triggeredBy: jwtUser.email,
        source: 'manual',
      }
    }
  }

  return { authenticated: false, triggeredBy: '', source: 'manual' }
}

function parseCSVText(csvText: string): NextivaCSVRow[] {
  const result = Papa.parse<NextivaCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter(
      (e) => e.type !== 'FieldMismatch'
    )
    if (criticalErrors.length > 0) {
      throw new Error(
        `CSV parse errors: ${criticalErrors.map((e) => e.message).join('; ')}`
      )
    }
  }

  if (!result.data || result.data.length === 0) {
    throw new Error('CSV file is empty or contains no valid data')
  }

  // Validate that the Name column exists
  const firstRow = result.data[0]
  if (!('Name' in firstRow)) {
    // Try case-insensitive header lookup
    const headers = Object.keys(firstRow)
    const nameHeader = headers.find((h) => h.toLowerCase().trim() === 'name')
    if (!nameHeader) {
      throw new Error(
        'CSV missing required "Name" column. Found columns: ' +
          headers.join(', ')
      )
    }
  }

  return result.data
}

export async function POST(request: NextRequest) {
  try {
    // --- Authenticate ---
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized — valid admin session or SYNC_SECRET required' },
        { status: 401 }
      )
    }

    // --- Extract CSV text from request ---
    let csvText: string

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Admin UI upload — FormData with a "file" field
      const formData = await request.formData()
      const file = formData.get('file')

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'Missing "file" field in form data' },
          { status: 400 }
        )
      }

      csvText = await file.text()
    } else if (
      contentType.includes('text/csv') ||
      contentType.includes('application/octet-stream')
    ) {
      // Automated upload — raw CSV body
      csvText = await request.text()
    } else {
      // Try to read as text regardless (be forgiving)
      csvText = await request.text()
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty CSV body' },
        { status: 400 }
      )
    }

    // --- Parse CSV ---
    let rows: NextivaCSVRow[]
    try {
      rows = parseCSVText(csvText)
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'CSV parsing failed',
          details: parseError instanceof Error ? parseError.message : String(parseError),
        },
        { status: 400 }
      )
    }

    // --- Run sync engine ---
    const syncResult = await runNextivaSync(rows, auth.triggeredBy, auth.source)

    return NextResponse.json({
      success: true,
      ...syncResult,
    })
  } catch (error) {
    console.error('Sync upload error:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
