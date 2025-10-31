import bcrypt from 'bcryptjs'

// Helper script to generate password hashes
// Usage: npx tsx scripts/generate-password-hash.ts "yourpassword"

const password = process.argv[2]

if (!password) {
  console.error('Usage: npx tsx scripts/generate-password-hash.ts "yourpassword"')
  process.exit(1)
}

bcrypt.hash(password, 10).then(hash => {
  console.log('\nPassword:', password)
  console.log('Hash:', hash)
  console.log('\nAdd this hash to your users.json file\n')
})
