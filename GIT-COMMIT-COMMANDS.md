# Git Commit Commands

Run these commands in your WSL terminal or Git Bash:

```bash
cd "/home/jryan/Heaton Web Directory Prod"

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Fix TypeScript error: Add passwordHash when creating users

- Update users route to require password and hash it
- Include passwordHash in new user creation
- Add editor role to valid roles check"

# Push to GitHub
git push origin main
```

## After Pushing:

1. **Vercel will auto-deploy** (if connected to GitHub)
2. **Add SESSION_SECRET** to Vercel environment variables (see SESSION_SECRET.txt)
3. **Redeploy** after adding SESSION_SECRET

---

## Quick Copy-Paste:

```bash
cd "/home/jryan/Heaton Web Directory Prod" && git add . && git commit -m "Fix TypeScript error: Add passwordHash when creating users" && git push origin main
```

