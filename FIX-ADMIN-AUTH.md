# Fix Admin Authentication Issue

## Problem
Admin login is not working on https://heaton-web-directory-prod.vercel.app/admin

## Root Cause
The `SESSION_SECRET` environment variable is **not set in Vercel**. Without this, the JWT session tokens cannot be properly signed and verified, causing authentication to fail.

## Verified Working
✅ Credentials are correct: `editor@internal` / `HeatonEditor2025`
✅ Password hash verification passes
✅ All authentication code is properly implemented
❌ Missing `SESSION_SECRET` in Vercel environment variables

---

## Solution: Add SESSION_SECRET to Vercel

### Step 1: Generate a Secure Secret

Run this command in your terminal (WSL or Git Bash):
```bash
openssl rand -base64 32
```

**Example output** (yours will be different):
```
r8Xp2mK9vL4nQ7wZ5yB3dF6hJ1tR0uM8cE5aN2sP9xV4=
```

**Copy this entire string** - you'll need it in the next step.

---

### Step 2: Add to Vercel Environment Variables

1. Go to https://vercel.com and log in
2. Navigate to your project: **heaton-web-directory-prod**
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New** button
6. Fill in the form:
   - **Name:** `SESSION_SECRET`
   - **Value:** [Paste the secret you generated above]
   - **Environment:** Check **Production** (also check Preview/Development if you want)
7. Click **Save**

---

### Step 3: Redeploy the Application

After adding the environment variable, you MUST redeploy:

1. Go to the **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** (three dots) menu on the right
4. Click **Redeploy**
5. Confirm the redeploy

⏰ Wait 2-3 minutes for the deployment to complete.

---

### Step 4: Test the Login

1. Visit: https://heaton-web-directory-prod.vercel.app/admin
2. You should see the login page
3. Enter credentials:
   - **Email:** `editor@internal`
   - **Password:** `HeatonEditor2025`
4. Click **Sign In**
5. You should now be logged in! ✅

---

## All User Credentials

### Super Admin
- **Email:** jryan5150@gmail.com
- **Password:** HeatonAdmin2025!
- **Can:** Everything (manage users, approve, publish)

### Approver
- **Email:** m.balderas@heatoneye.com
- **Password:** Balderas2025!
- **Can:** Approve/reject changes (cannot publish or manage users)

### Editor
- **Email:** editor@internal
- **Password:** HeatonEditor2025
- **Can:** Submit changes only (cannot approve or publish)

---

## Why This Happened

The SESSION_SECRET is used to sign JWT tokens for user sessions. Without it:
- Login appears to work but sessions don't persist
- Middleware can't verify the session cookie
- Users get redirected back to login

The code has a fallback value (`'your-secret-key-change-in-production'`), but Vercel's edge environment requires the actual environment variable to be explicitly set.

---

## Troubleshooting

### Still can't login after adding SESSION_SECRET?

1. **Clear browser cookies**
   - Press F12 → Application tab → Cookies
   - Delete all cookies for your site
   - Try logging in again

2. **Verify the environment variable**
   - Go to Vercel → Settings → Environment Variables
   - Confirm `SESSION_SECRET` is there
   - Make sure it's checked for "Production"

3. **Check deployment logs**
   - Go to Deployments tab
   - Click on latest deployment
   - Look for any build or runtime errors

4. **Try a different browser**
   - Sometimes cached data can cause issues
   - Try incognito/private mode

---

## Need More Help?

Check the browser console (F12 → Console tab) for error messages and share them.

---

**Last Updated:** 2025-10-31
**Status:** Fix ready to deploy
