import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

// Helper script to verify password against stored hash
// Usage: npx tsx scripts/verify-password.ts "password" "email"

const password = process.argv[2]
const email = process.argv[3]

if (!password || !email) {
  console.error('Usage: npx tsx scripts/verify-password.ts "password" "email"')
  process.exit(1)
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')
const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())

if (!user) {
  console.error(`User with email ${email} not found`)
  process.exit(1)
}

console.log('\nVerifying password for:', email)
console.log('Stored hash:', user.passwordHash)

bcrypt.compare(password, user.passwordHash).then(isValid => {
  console.log('Password matches:', isValid)

  if (!isValid) {
    console.log('\nGenerating correct hash for provided password...')
    bcrypt.hash(password, 10).then(newHash => {
      console.log('New hash:', newHash)
      console.log('\nUpdate users.json with this hash if this is the correct password')
    })
  }
})
