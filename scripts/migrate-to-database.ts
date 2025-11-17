import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database migration...\n')

  // 1. Migrate Employees
  console.log('📋 Migrating employees...')
  const employeesPath = path.join(process.cwd(), 'data', 'employees.json')
  const employeesData = JSON.parse(fs.readFileSync(employeesPath, 'utf-8'))

  let employeeCount = 0
  for (const emp of employeesData) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email || null,
        extension: emp.extension || null,
        phoneNumber: emp.phoneNumber || null,
        did: emp.did || null,
        location: emp.location || 'Unknown',
        team: emp.team || emp.department || 'General',
        title: emp.title || null,
        jobTitle: emp.jobTitle || null,
        department: emp.department || null,
        photoUrl: emp.photoUrl || null,
        avatarUrl: emp.avatarUrl || null,
      },
      create: {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email || null,
        extension: emp.extension || null,
        phoneNumber: emp.phoneNumber || null,
        did: emp.did || null,
        location: emp.location || 'Unknown',
        team: emp.team || emp.department || 'General',
        title: emp.title || null,
        jobTitle: emp.jobTitle || null,
        department: emp.department || null,
        photoUrl: emp.photoUrl || null,
        avatarUrl: emp.avatarUrl || null,
      }
    })
    employeeCount++
    if (employeeCount % 50 === 0) {
      console.log(`  Migrated ${employeeCount} employees...`)
    }
  }
  console.log(`✅ Migrated ${employeeCount} employees\n`)

  // 2. Migrate Users
  console.log('👤 Migrating users...')
  const usersPath = path.join(process.cwd(), 'data', 'users.json')
  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'))

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        addedAt: new Date(user.addedAt),
        addedBy: user.addedBy,
      }
    })
    console.log(`  Migrated user: ${user.email} (${user.role})`)
  }
  console.log(`✅ Migrated ${usersData.length} users\n`)

  // 3. Migrate Pending Changes (if any)
  console.log('📝 Migrating pending changes...')
  const pendingPath = path.join(process.cwd(), 'data', 'pending-changes.json')
  if (fs.existsSync(pendingPath)) {
    const pendingData = JSON.parse(fs.readFileSync(pendingPath, 'utf-8'))

    for (const change of pendingData) {
      await prisma.pendingChange.create({
        data: {
          id: change.id,
          type: change.type,
          employeeId: change.employeeId,
          beforeData: change.before || null,
          afterData: change.after || null,
          status: change.status,
          proposedBy: change.proposedBy,
          proposedAt: new Date(change.proposedAt),
          approvedBy: change.approvedBy || null,
          approvedAt: change.approvedAt ? new Date(change.approvedAt) : null,
          notes: change.notes || null,
        }
      })
    }
    console.log(`✅ Migrated ${pendingData.length} pending changes\n`)
  } else {
    console.log('  No pending changes file found\n')
  }

  // 4. Migrate Version History (if any)
  console.log('📚 Migrating version history...')
  const versionsPath = path.join(process.cwd(), 'data', 'versions.json')
  if (fs.existsSync(versionsPath)) {
    const versionsData = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'))

    for (const version of versionsData) {
      await prisma.version.create({
        data: {
          versionId: version.id,
          timestamp: new Date(version.timestamp),
          author: version.author,
          changeCount: version.changeCount || 0,
          snapshot: version.snapshot,
          description: version.description || null,
        }
      })
    }
    console.log(`✅ Migrated ${versionsData.length} versions\n`)
  } else {
    console.log('  No versions file found\n')
  }

  console.log('🎉 Migration complete!')

  // Print summary
  const empCount = await prisma.employee.count()
  const userCount = await prisma.user.count()
  const changeCount = await prisma.pendingChange.count()
  const versionCount = await prisma.version.count()

  console.log('\n📊 Database Summary:')
  console.log(`  Employees: ${empCount}`)
  console.log(`  Users: ${userCount}`)
  console.log(`  Pending Changes: ${changeCount}`)
  console.log(`  Versions: ${versionCount}`)
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
