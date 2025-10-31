# Deployment Checklist

## ✅ Step 1: Commit & Push to GitHub

Run these commands in your terminal (WSL or Git Bash):

```bash
cd "/home/jryan/Heaton Web Directory Prod"

# Check what changed
git status

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add password-based authentication system (Steps 4-6)"

# Push to GitHub
git push origin main
```

**Note:** If you haven't initialized git or connected to a remote, you'll need to:
```bash
git init
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

---

## ✅ Step 2: Deploy to Vercel

### Option A: If project already exists on Vercel
1. Go to [vercel.com](https://vercel.com) and log in
2. Your project should auto-deploy when you push to GitHub
3. If not, go to your project → Settings → Git → Redeploy

### Option B: If creating new Vercel project
1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `heaton-web-directory-prod`
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

---

## ✅ Step 3: Add Environment Variables

**CRITICAL:** You must add `SESSION_SECRET` or login won't work!

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `SESSION_SECRET`
   - **Value:** Generate with: `openssl rand -base64 32` (or use any long random string)
   - **Environment:** Select **Production** (and Preview/Development if you want)
4. Click **Save**

**Generate SESSION_SECRET:**
```bash
# In WSL terminal:
openssl rand -base64 32
```

Example output (copy this entire string):
```
kj3h4k5jh34k5jh3k4j5h3k4j5h3k4j5h3k4j5h3k45=
```

**After adding the variable:**
- Go to **Deployments** tab
- Click the **⋯** menu on latest deployment
- Click **Redeploy** (this ensures env vars are loaded)

---

## ✅ Step 4: Test Production Deployment

1. Go to your Vercel project dashboard
2. Find your deployment URL (e.g., `heaton-web-directory-prod.vercel.app`)
3. Test these URLs:
   - **Public directory:** `https://your-project.vercel.app/`
   - **Admin login:** `https://your-project.vercel.app/admin` (should redirect to login)

### Test Login Credentials:
- **Super Admin:** `jryan5150@gmail.com` / `HeatonAdmin2025!`
- **Approver:** `m.balderas@heatoneye.com` / `Balderas2025!`
- **Editor:** `editor@internal` / `HeatonEditor2025`

---

## 🎯 What to Verify:

- ✅ Public directory loads at `/`
- ✅ `/admin` redirects to `/admin/login`
- ✅ Login form appears
- ✅ Can login with superadmin credentials
- ✅ Dashboard loads with all tabs
- ✅ Can logout and login again

---

## 🆘 Troubleshooting

**Issue:** Login fails with "Invalid email or password"
- Check that `SESSION_SECRET` is set in Vercel
- Redeploy after adding environment variable
- Verify `data/users.json` has correct password hashes

**Issue:** Deployment fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check for TypeScript errors locally first

**Issue:** "Session not found" errors
- `SESSION_SECRET` must be set
- Redeploy after adding env var
- Clear browser cookies and try again

---

## 📝 Next Steps (Future):

When ready to add custom domain:
1. Vercel → Project Settings → Domains
2. Add: `staff.heatoneye.com`
3. Configure DNS records as shown
4. Wait for SSL certificate (usually 5-10 minutes)

---

**Good luck with deployment! 🚀**

