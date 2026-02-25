/**
 * Nextiva CSV Sync Engine
 *
 * Multi-tier matching algorithm that syncs Nextiva phone system CSV exports
 * against the employee directory. Filters non-person entries, matches employees
 * via email/mapping/name, auto-updates phone fields, and creates PendingChanges
 * for unmatched real persons.
 */

import prisma from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NextivaCSVRow {
  Name: string
  Email: string
  'Phone Number': string
  Extension: string
  Team: string
  Role: string
  Status: string
  'Created Date': string
  'Updated Date': string
  'Deactivated Date': string
  Location: string
  'Time Zone': string
  'Voice-Enabled': string
  [key: string]: string // Allow extra columns
}

export interface SyncResult {
  totalRows: number
  matched: number
  created: number
  updated: number
  skipped: number
  errors: number
  details: {
    autoUpdated: Array<{
      employeeId: string
      name: string
      changes: Record<string, { old: string; new: string }>
    }>
    pendingReview: Array<{
      name: string
      email: string
      reason: string
    }>
    skippedEntries: Array<{
      name: string
      reason: string
    }>
    errorEntries: Array<{
      row: number
      name: string
      error: string
    }>
  }
}

interface ParsedPerson {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  extension: string
  team: string
  location: string
  role: string
  rawName: string
}

// ---------------------------------------------------------------------------
// Location normalization (mirrors csvImport.ts LOCATION_MAPPINGS)
// ---------------------------------------------------------------------------

const LOCATION_MAPPINGS: Record<string, string> = {
  'longview': 'Longview',
  'athens': 'Athens',
  'tyler': 'Tyler',
  'gun barrel city': 'Gun Barrel City',
  'tyler boa': 'Tyler',
  'tyler bldg 1': 'Tyler',
  'tyler bldg 2': 'Tyler',
  'tyler building 1': 'Tyler',
  'tyler building 2': 'Tyler',
  'gunbarrel': 'Gun Barrel City',
  'gun barrel': 'Gun Barrel City',
  'gunbarrelcity': 'Gun Barrel City',
}

function normalizeLocation(location: string): string {
  if (!location) return ''

  const cleaned = location.toLowerCase().trim()

  if (LOCATION_MAPPINGS[cleaned]) {
    return LOCATION_MAPPINGS[cleaned]
  }

  for (const [key, value] of Object.entries(LOCATION_MAPPINGS)) {
    if (cleaned.includes(key)) {
      return value
    }
  }

  return location
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// ---------------------------------------------------------------------------
// Non-person filtering
// ---------------------------------------------------------------------------

/**
 * Prefixes and standalone tokens that indicate a CSV row is a room, device,
 * fax line, or other non-person entry. Case-insensitive matching.
 */
const NON_PERSON_PREFIXES = [
  'asc',
  'ascan',
  'bldg',
  'bo ',
  'break room',
  'call park',
  'central',
  'conference room',
  'copy room',
  'courtesy',
  'doctor station',
  'east work',
  'ec ',
  'elevator',
  'front desk',
  'gbc',
  'hea ',
  'history',
  'hr fax',
  'l-asc',
  'laser room',
  'lgv front',
  'lgv longview',
  'llsc',
  'longview chk',
  'optical',
  'patient phone',
  'pedi',
  'spc pro',
  'special',
  'tyler kitchen',
  'v-f room',
  'visual field',
  'work room',
]

/**
 * Regex patterns for entries that look like devices/rooms even without a prefix match.
 * "Tech 1", "Tech.2", "Tech 12" patterns.
 */
const NON_PERSON_PATTERNS = [
  /^tech[\s.]\d/i,
  /^desk\b/i,
  /^lobby\b/i,
  /cordless/i,
]

/**
 * Email domains that are NOT heatoneye.com -- treated as external/non-person entries.
 */
const ALLOWED_EMAIL_DOMAINS = ['heatoneye.com']

function isNonPerson(name: string, email: string): { skip: boolean; reason: string } {
  const lowerName = name.toLowerCase().trim()

  // Check prefix-based filters
  for (const prefix of NON_PERSON_PREFIXES) {
    if (lowerName.startsWith(prefix)) {
      // GBC exception: allow if it looks like a real name after "GBC"
      // e.g. "GBC John Smith" is likely a person at Gun Barrel City
      if (prefix === 'gbc' && lowerName.length > 4 && /^gbc\s+[a-z]+\s+[a-z]+/i.test(lowerName)) {
        continue
      }
      return { skip: true, reason: `Name matches non-person prefix: "${prefix}"` }
    }
  }

  // Check regex patterns
  for (const pattern of NON_PERSON_PATTERNS) {
    if (pattern.test(lowerName)) {
      return { skip: true, reason: `Name matches non-person pattern: ${pattern.source}` }
    }
  }

  // Check email domain -- skip non-heatoneye emails
  if (email && email.trim() !== '') {
    const emailLower = email.toLowerCase().trim()
    const domain = emailLower.split('@')[1]
    if (domain && !ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return { skip: true, reason: `Non-heatoneye email domain: @${domain}` }
    }
  }

  // If no name at all, skip
  if (!lowerName) {
    return { skip: true, reason: 'Empty name' }
  }

  return { skip: false, reason: '' }
}

// ---------------------------------------------------------------------------
// Name parsing
// ---------------------------------------------------------------------------

function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '', lastName: '' }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  // Simple split: first word = firstName, rest = lastName
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

// ---------------------------------------------------------------------------
// Row parsing
// ---------------------------------------------------------------------------

function parseRow(row: NextivaCSVRow): ParsedPerson {
  const rawName = (row.Name || '').trim()
  const { firstName, lastName } = parseName(rawName)

  return {
    firstName,
    lastName,
    email: (row.Email || '').trim(),
    phoneNumber: (row['Phone Number'] || '').trim(),
    extension: (row.Extension || '').trim(),
    team: (row.Team || '').trim(),
    location: normalizeLocation(row.Location || ''),
    role: (row.Role || '').trim(),
    rawName,
  }
}

// ---------------------------------------------------------------------------
// Field diff — computes changes between current employee and Nextiva data
// ---------------------------------------------------------------------------

function computeFieldChanges(
  employee: {
    extension: string | null
    phoneNumber: string | null
    location: string
    team: string
  },
  nextiva: ParsedPerson
): Record<string, { old: string; new: string }> {
  const changes: Record<string, { old: string; new: string }> = {}

  // Extension
  if (nextiva.extension && nextiva.extension !== (employee.extension || '')) {
    changes.extension = {
      old: employee.extension || '',
      new: nextiva.extension,
    }
  }

  // Phone Number
  if (nextiva.phoneNumber && nextiva.phoneNumber !== (employee.phoneNumber || '')) {
    changes.phoneNumber = {
      old: employee.phoneNumber || '',
      new: nextiva.phoneNumber,
    }
  }

  // Location (only if Nextiva has a value and it differs after normalization)
  if (nextiva.location && nextiva.location !== employee.location) {
    changes.location = {
      old: employee.location,
      new: nextiva.location,
    }
  }

  // Team (only update if employee's current team is empty or "Unassigned")
  const currentTeam = employee.team || ''
  if (
    nextiva.team &&
    (currentTeam === '' || currentTeam.toLowerCase() === 'unassigned') &&
    nextiva.team.toLowerCase() !== currentTeam.toLowerCase()
  ) {
    changes.team = {
      old: currentTeam,
      new: nextiva.team,
    }
  }

  return changes
}

// ---------------------------------------------------------------------------
// Core sync engine
// ---------------------------------------------------------------------------

export async function runNextivaSync(
  rows: NextivaCSVRow[],
  triggeredBy: string,
  source: 'manual' | 'automated'
): Promise<SyncResult> {
  const result: SyncResult = {
    totalRows: rows.length,
    matched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: {
      autoUpdated: [],
      pendingReview: [],
      skippedEntries: [],
      errorEntries: [],
    },
  }

  // Batch-load all employees and sync mappings upfront to avoid N+1
  const [allEmployees, allMappings] = await Promise.all([
    prisma.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        extension: true,
        phoneNumber: true,
        location: true,
        team: true,
      },
    }),
    prisma.syncMapping.findMany(),
  ])

  // Build lookup indexes for fast matching
  const employeeByEmail = new Map<string, (typeof allEmployees)[number]>()
  for (const emp of allEmployees) {
    if (emp.email) {
      employeeByEmail.set(emp.email.toLowerCase(), emp)
    }
  }

  const employeeById = new Map<string, (typeof allEmployees)[number]>()
  for (const emp of allEmployees) {
    employeeById.set(emp.id, emp)
  }

  const mappingByEmail = new Map<string, string>()
  for (const mapping of allMappings) {
    mappingByEmail.set(mapping.nextivaEmail.toLowerCase(), mapping.employeeId)
  }

  // Build name lookup: "firstname|lastname" -> employee
  // Using pipe separator to avoid collision with name parts containing spaces
  const employeeByName = new Map<string, (typeof allEmployees)[number]>()
  for (const emp of allEmployees) {
    const key = `${emp.firstName.toLowerCase()}|${emp.lastName.toLowerCase()}`
    employeeByName.set(key, emp)
  }

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2 // +2 because row 1 is header, data starts at row 2

    try {
      const parsed = parseRow(rows[i])

      // --- Non-person filter ---
      const filterResult = isNonPerson(parsed.rawName, parsed.email)
      if (filterResult.skip) {
        result.skipped++
        result.details.skippedEntries.push({
          name: parsed.rawName || '(empty)',
          reason: filterResult.reason,
        })
        continue
      }

      // --- Multi-tier matching ---
      let matchedEmployee: (typeof allEmployees)[number] | undefined

      // Tier 1: Email match
      if (parsed.email) {
        matchedEmployee = employeeByEmail.get(parsed.email.toLowerCase())
      }

      // Tier 2: SyncMapping table
      if (!matchedEmployee && parsed.email) {
        const mappedId = mappingByEmail.get(parsed.email.toLowerCase())
        if (mappedId) {
          matchedEmployee = employeeById.get(mappedId)
        }
      }

      // Tier 3: Name match (both first AND last must match)
      if (!matchedEmployee && parsed.firstName && parsed.lastName) {
        const nameKey = `${parsed.firstName.toLowerCase()}|${parsed.lastName.toLowerCase()}`
        matchedEmployee = employeeByName.get(nameKey)

        // Try reversed order (in case CSV has "LastName FirstName")
        if (!matchedEmployee) {
          const reversedKey = `${parsed.lastName.toLowerCase()}|${parsed.firstName.toLowerCase()}`
          matchedEmployee = employeeByName.get(reversedKey)
        }
      }

      if (matchedEmployee) {
        // --- Matched: compute and apply changes ---
        result.matched++

        const changes = computeFieldChanges(matchedEmployee, parsed)

        if (Object.keys(changes).length > 0) {
          // Build Prisma update payload from changes
          const updateData: Record<string, string> = {}
          for (const [field, { new: newVal }] of Object.entries(changes)) {
            updateData[field] = newVal
          }

          await prisma.employee.update({
            where: { id: matchedEmployee.id },
            data: updateData,
          })

          result.updated++
          result.details.autoUpdated.push({
            employeeId: matchedEmployee.id,
            name: `${matchedEmployee.firstName} ${matchedEmployee.lastName}`,
            changes,
          })
        }
      } else {
        // --- Unmatched real person: create PendingChange ---
        result.created++
        result.details.pendingReview.push({
          name: parsed.rawName,
          email: parsed.email,
          reason: 'No matching employee found via email, mapping, or name',
        })

        await prisma.pendingChange.create({
          data: {
            type: 'add',
            employeeId: null,
            beforeData: undefined,
            afterData: {
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              email: parsed.email || undefined,
              extension: parsed.extension || undefined,
              phoneNumber: parsed.phoneNumber || undefined,
              location: parsed.location || 'Unknown',
              team: parsed.team || 'Unassigned',
              jobTitle: parsed.role || undefined,
            },
            status: 'pending',
            proposedBy: 'nextiva-sync',
            notes: 'Auto-imported from Nextiva CSV sync — review required',
          },
        })
      }
    } catch (err) {
      result.errors++
      result.details.errorEntries.push({
        row: rowNum,
        name: rows[i]?.Name || '(unknown)',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // --- Log the sync operation ---
  await prisma.syncLog.create({
    data: {
      source,
      totalRows: result.totalRows,
      matched: result.matched,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      details: result.details as object,
      triggeredBy,
    },
  })

  return result
}
