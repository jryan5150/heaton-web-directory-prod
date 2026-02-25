import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OFFICE_IPS = [
  { ip: '4.36.173.10', location: 'Athens', notes: '1240 S Palestine St, Athens, TX 75751' },
  { ip: '66.76.57.122', location: 'Athens', notes: '1240 S Palestine St, Athens, TX 75751' },
  { ip: '12.156.3.90', location: 'Tyler', notes: 'Tyler office' },
  { ip: '75.110.177.134', location: 'Tyler', notes: 'Tyler office' },
  { ip: '209.245.234.34', location: 'Gun Barrel City', notes: 'GBC office' },
  { ip: '209.33.56.59', location: 'Gun Barrel City', notes: 'GBC office' },
  { ip: '12.164.166.172', location: 'Longview', notes: 'Longview office' },
  { ip: '206.255.14.253', location: 'Longview', notes: 'Longview office' },
]

async function main() {
  console.log('Seeding allowed IPs...')

  for (const entry of OFFICE_IPS) {
    await prisma.allowedIP.upsert({
      where: { ip: entry.ip },
      update: { location: entry.location, notes: entry.notes },
      create: { ...entry, addedBy: 'system-seed' },
    })
    console.log(`  ✓ ${entry.ip} (${entry.location})`)
  }

  console.log(`\nSeeded ${OFFICE_IPS.length} IPs.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
