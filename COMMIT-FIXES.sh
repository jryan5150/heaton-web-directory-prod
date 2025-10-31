#!/bin/bash
# Script to commit and push the TypeScript fix

cd "/home/jryan/Heaton Web Directory Prod"

echo "Staging changes..."
git add .

echo "Committing..."
git commit -m "Fix TypeScript error: Add passwordHash when creating users

- Update users route to require password and hash it
- Include passwordHash in new user creation
- Add editor role to valid roles check"

echo "Pushing to GitHub..."
git push origin main

echo "✅ Changes pushed successfully!"
echo ""
echo "Next step: Add SESSION_SECRET to Vercel:"
echo "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "2. Add: SESSION_SECRET = (see SESSION_SECRET.txt)"
echo "3. Redeploy after adding"

