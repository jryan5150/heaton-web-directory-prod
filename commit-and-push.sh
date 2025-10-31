#!/bin/bash
# Script to commit and push changes to GitHub

cd "/home/jryan/Heaton Web Directory Prod"

# Fix git ownership if needed
git config --global --add safe.directory "//wsl.localhost/Ubuntu/home/jryan/Heaton Web Directory Prod" 2>/dev/null

# Check status
echo "Checking git status..."
git status

# Stage all changes
echo "Staging all changes..."
git add .

# Commit
echo "Committing changes..."
git commit -m "Add password-based authentication system (Steps 4-6)

- Replace OAuth login with password-based form
- Update middleware to use JWT session cookies
- Remove NextAuth dependencies from AdminDashboard
- Add session-based authentication flow
- Support 3 roles: superadmin, approver, editor"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo "Done! Changes have been pushed to GitHub."

