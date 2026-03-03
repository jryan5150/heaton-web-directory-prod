import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

// Load env
config({ path: '.env.local' })

const prisma = new PrismaClient({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
})

const TEMP_PASSWORD = process.env.ADMIN_TEMP_PASSWORD || (() => { throw new Error('Set ADMIN_TEMP_PASSWORD env var') })()

const newUsers = [
  { email: 'k.evans@heatoneye.com', name: 'K. Evans', role: 'superadmin' },
  { email: 'lrenfroe@heatoneye.com', name: 'L. Renfroe', role: 'superadmin' },
]

async function main() {
  console.log('Connecting to database...')

  // First, list existing users
  const existing = await prisma.user.findMany({ select: { email: true, role: true } })
  console.log('\nExisting users:')
  existing.forEach(u => console.log(`  - ${u.email} (${u.role})`))

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10)

  for (const user of newUsers) {
    const exists = await prisma.user.findUnique({ where: { email: user.email } })
    if (exists) {
      console.log(`\n⚠ ${user.email} already exists — skipping`)
      continue
    }

    const created = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        addedBy: 'jryan5150@gmail.com',
      }
    })
    console.log(`\n✓ Added ${created.email} as ${created.role}`)
  }

  // Verify
  const allUsers = await prisma.user.findMany({ select: { email: true, role: true, addedAt: true } })
  console.log('\n--- All users after update ---')
  allUsers.forEach(u => console.log(`  ${u.email} | ${u.role} | added ${u.addedAt.toISOString().split('T')[0]}`))
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
