# Quick Deploy Steps (4-6) - ~45 minutes

## ✅ Already Done:
- Dependencies installed (bcryptjs, jose, resend)
- Auth helpers created
- API routes created (login, logout, session)
- Password hashes generated
- users.json updated with 3 users
- Type definitions updated

## 🔨 Do These Next:

### Step 4: Create Login Page (15 min)

Open this file in your editor:
```
src/app/admin/login/page.tsx
```

**Replace the ENTIRE file** with the code from `IMPLEMENTATION-GUIDE.md` Step 4 (starts at line 175).

The key parts:
- Email and password input fields
- Form submission to `/api/admin/login`
- Error handling
- Redirect to `/admin` on success

### Step 5: Update Middleware (10 min)

Open this file:
```
src/middleware.ts
```

**Replace the ENTIRE file** with the code from `IMPLEMENTATION-GUIDE.md` Step 5 (starts at line 379).

Key changes:
- Remove NextAuth auth() wrapper
- Use `getSessionFromRequest` from auth-helpers
- Check for session cookie instead of OAuth
- Remove password protection from `/` (make it public)

### Step 6: Update AdminDashboard (20 min)

Open this file:
```
src/components/admin/AdminDashboard.tsx
```

Make these changes:

**1. Remove this import:**
```typescript
import { useSession, signOut } from 'next-auth/react'
```

**2. Add this import:**
```typescript
import { useRouter } from 'next/navigation'
```

**3. Replace this line:**
```typescript
const { data: session, status } = useSession()
```
**With:**
```typescript
const router = useRouter()
```

**4. Update useEffect (around line 24):**
```typescript
useEffect(() => {
  loadUserInfo()
  loadData()
}, [])
```

**5. Update loadUserInfo function (around line 31):**
```typescript
const loadUserInfo = async () => {
  try {
    const response = await fetch('/api/admin/session')
    if (response.ok) {
      const userData = await response.json()
      setCurrentUser(userData)
    } else {
      router.push('/admin/login')
    }
  } catch (error) {
    console.error('Error loading user info:', error)
    router.push('/admin/login')
  }
}
```

**6. Update sign out button (around line 107):**
```typescript
onClick={async () => {
  await fetch('/api/admin/logout', { method: 'POST' })
  router.push('/admin/login')
}}
```

**7. Update admin page** - Remove SessionProvider wrapper:

Open: `src/app/admin/page.tsx`

Replace with:
```typescript
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  return <AdminDashboard />
}
```

---

## 🧪 Test It!

```bash
# Make sure dev server is running
cd "/home/jryan/Heaton Web Directory Prod"
npm run dev

# Visit: http://localhost:3000/admin
```

**You should:**
1. Be redirected to login page
2. Login with `jryan5150@gmail.com` / `HeatonAdmin2025!`
3. See admin dashboard
4. Be able to click through all tabs

---

## 📦 Deploy to Vercel (15 min)

### 1. Commit & Push to GitHub
```bash
cd "/home/jryan/Heaton Web Directory Prod"
git add .
git commit -m "Add password-based authentication system"
git push origin main
```

### 2. Create Vercel Project (if not done)
- Go to vercel.com
- Import GitHub repo "heaton-web-directory-prod"
- Click Deploy

### 3. Add Environment Variables in Vercel
Go to: Project Settings → Environment Variables

Add these for **Production**:
```
SESSION_SECRET = (generate with: openssl rand -base64 32)
```

Example:
```
SESSION_SECRET=kj3h4k5jh34k5jh3k4j5h3k4j5h3k4j5h3k4j5h3k45=
```

### 4. Configure Custom Domain
- Settings → Domains
- Add: `staff.heatoneye.com`
- Copy DNS records
- Add to GoDaddy:
  - Type: CNAME
  - Name: staff
  - Value: (from Vercel)
- Wait 5-10 minutes

### 5. Test Production
- Visit: `https://staff.heatoneye.com`
- Should show public employee directory
- Visit: `https://staff.heatoneye.com/admin`
- Should redirect to login
- Login and test!

---

## 📧 Share These Links:

**Public Directory:**
`https://staff.heatoneye.com`

**Admin Login (for you):**
`https://staff.heatoneye.com/admin`
- Email: jryan5150@gmail.com
- Password: HeatonAdmin2025!

**Admin Login (for M. Balderas):**
`https://staff.heatoneye.com/admin`
- Email: m.balderas@heatoneye.com
- Password: Balderas2025!
- Role: Can approve/reject (can't publish)

**Admin Login (for other staff):**
`https://staff.heatoneye.com/admin`
- Email: editor@internal
- Password: HeatonEditor2025
- Role: Can submit changes only

---

## 🆘 If Something Breaks

Check dev server output:
```bash
# Kill existing server
# Then restart:
cd "/home/jryan/Heaton Web Directory Prod"
npm run dev
```

Check browser console for errors (F12 → Console tab)

---

## ✅ What You'll Have After This:

- ✅ Working login system
- ✅ 3-tier role system (superadmin, approver, editor)
- ✅ Public directory at `/`
- ✅ Protected admin at `/admin`
- ✅ Live on staff.heatoneye.com

**For email notifications (Steps 7-12)**, start a new Claude Code session with the IMPLEMENTATION-GUIDE.md file!

Good luck! 🚀
