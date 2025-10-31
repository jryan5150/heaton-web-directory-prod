# Git Commands to Run

Run these commands in your WSL terminal or Git Bash:

```bash
cd "/home/jryan/Heaton Web Directory Prod"

# Fix git ownership if needed (only if you get an error)
git config --global --add safe.directory "//wsl.localhost/Ubuntu/home/jryan/Heaton Web Directory Prod"

# Check what changed
git status

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add password-based authentication system (Steps 4-6)

- Replace OAuth login with password-based form
- Update middleware to use JWT session cookies  
- Remove NextAuth dependencies from AdminDashboard
- Add session-based authentication flow
- Support 3 roles: superadmin, approver, editor"

# Push to GitHub
git push origin main
```

## Files Changed:
- `src/app/admin/login/page.tsx` - New password-based login form
- `src/middleware.ts` - Updated to use session-based auth
- `src/components/admin/AdminDashboard.tsx` - Removed NextAuth hooks
- `src/app/admin/page.tsx` - Removed SessionProvider wrapper
- `DEPLOY-CHECKLIST.md` - New deployment guide (optional to commit)

