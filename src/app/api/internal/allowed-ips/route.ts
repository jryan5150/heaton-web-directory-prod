import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

/**
 * Internal API endpoint to return allowed IPs from the database.
 * Protected by an internal secret to prevent external abuse.
 * Called by middleware to check IP restrictions on public routes.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-internal-secret')
  const internalSecret = process.env.INTERNAL_API_SECRET

  if (!internalSecret || authHeader !== internalSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const allowedIPs = await prisma.allowedIP.findMany({
      select: { ip: true },
    })

    const ips = allowedIPs.map((record) => record.ip)

    return NextResponse.json({ ips })
  } catch (error) {
    console.error('Failed to fetch allowed IPs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch allowed IPs' },
      { status: 500 }
    )
  }
}
