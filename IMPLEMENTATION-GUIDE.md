# Admin Portal Implementation Guide
## Password-Based Authentication System

### ✅ Already Completed (40%)

1. **Dependencies Installed**
   - ✅ Removed `next-auth`
   - ✅ Installed `bcryptjs`, `jose`, `resend`
   - ✅ Installed TypeScript types

2. **Auth Utilities Created**
   - ✅ `src/lib/auth-helpers.ts` - Password hashing, JWT sessions, role checking
   - ✅ `scripts/generate-password-hash.ts` - Password hash generator

3. **API Routes Created**
   - ✅ `src/app/api/admin/login/route.ts` - Login endpoint
   - ✅ `src/app/api/admin/logout/route.ts` - Logout endpoint
   - ✅ `src/app/api/admin/session/route.ts` - Get current user session

---

## 🔨 Remaining Steps (60%)

### Step 1: Generate Password Hashes (5 minutes)

Run these commands to generate password hashes:

```bash
cd "/home/jryan/Heaton Web Directory Prod"

# Generate hash for your superadmin password
npx tsx scripts/generate-password-hash.ts "YourSuperAdminPassword123"

# Generate hash for m.balderas (approver)
npx tsx scripts/generate-password-hash.ts "BalderasPassword123"

# Generate hash for shared editor password
npx tsx scripts/generate-password-hash.ts "EditorShared123"
```

**Save these hashes** - you'll need them in the next step.

---

### Step 2: Update users.json (5 minutes)

Replace the contents of `data/users.json`:

```json
[
  {
    "id": "user-superadmin",
    "email": "jryan5150@gmail.com",
    "name": "Jace Ryan",
    "role": "superadmin",
    "passwordHash": "PASTE_YOUR_SUPERADMIN_HASH_HERE",
    "addedAt": "2025-10-31T00:00:00.000Z",
    "addedBy": "system"
  },
  {
    "id": "user-approver",
    "email": "m.balderas@heatoneye.com",
    "name": "M. Balderas",
    "role": "approver",
    "passwordHash": "PASTE_BALDERAS_HASH_HERE",
    "addedAt": "2025-10-31T00:00:00.000Z",
    "addedBy": "jryan5150@gmail.com"
  },
  {
    "id": "user-editor",
    "email": "editor@internal",
    "name": "Staff Editor",
    "role": "editor",
    "passwordHash": "PASTE_EDITOR_HASH_HERE",
    "addedAt": "2025-10-31T00:00:00.000Z",
    "addedBy": "jryan5150@gmail.com"
  }
]
```

**Important**: Replace the three `PASTE_*_HASH_HERE` placeholders with the actual hashes from Step 1.

---

### Step 3: Update User Type Definition (2 minutes)

Edit `src/types/admin.ts` - Add `passwordHash` field:

```typescript
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  passwordHash: string  // ADD THIS LINE
  addedAt: string
  addedBy: string
}
```

Also add the editor role:

```typescript
export type UserRole = 'superadmin' | 'approver' | 'editor'  // ADD 'editor'
```

---

### Step 4: Create Simple Login Page (10 minutes)

Replace `src/app/admin/login/page.tsx` with:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background-color)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--border-radius-large)',
          padding: '48px',
          boxShadow: 'var(--shadow-medium)',
          border: '1px solid var(--border-color)'
        }}>
          {/* Logo/Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--primary-text-color)',
              marginBottom: '8px'
            }}>
              Heaton Eye Admin
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--secondary-text-color)',
              margin: 0
            }}>
              Sign in to access the admin portal
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px',
              color: 'var(--error-color)',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: 'var(--primary-text-color)'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="your.email@heatoneye.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: 'var(--primary-text-color)'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'var(--secondary-text-color)' : 'var(--accent-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Info */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'var(--background-color)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '12px',
              color: 'var(--secondary-text-color)',
              margin: 0
            }}>
              Contact Jace Ryan for access credentials
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            href="/"
            style={{
              fontSize: '14px',
              color: 'var(--accent-color)',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            ← Back to Employee Directory
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

### Step 5: Update Middleware (10 minutes)

Replace `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './lib/auth-helpers'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const user = await getSessionFromRequest(request)

    if (!user) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Remove password protection from main directory
  // (Public access to /)

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

---

### Step 6: Update AdminDashboard (10 minutes)

Edit `src/components/admin/AdminDashboard.tsx`:

**Remove these imports:**
```typescript
// DELETE THESE LINES:
import { useSession, signOut } from 'next-auth/react'
```

**Add this import:**
```typescript
import { useRouter } from 'next/navigation'
```

**Update the component:**

Find this line:
```typescript
const { data: session, status } = useSession()
```

Replace it with:
```typescript
const router = useRouter()
```

Find the `loadUserInfo` function and UPDATE it:
```typescript
const loadUserInfo = async () => {
  try {
    const response = await fetch('/api/admin/session')
    if (response.ok) {
      const userData = await response.json()
      setCurrentUser(userData)
    } else {
      // User not authenticated
      router.push('/admin/login')
    }
  } catch (error) {
    console.error('Error loading user info:', error)
    router.push('/admin/login')
  }
}
```

Find the useEffect and UPDATE it:
```typescript
useEffect(() => {
  loadUserInfo()
  loadData()
}, [])
```

Find the signOut button and UPDATE the onClick:
```typescript
onClick={async () => {
  await fetch('/api/admin/logout', { method: 'POST' })
  router.push('/admin/login')
}}
```

---

### Step 7: Remove OAuth Files (2 minutes)

Delete these files:
```bash
rm -rf "/home/jryan/Heaton Web Directory Prod/src/auth.ts"
rm -rf "/home/jryan/Heaton Web Directory Prod/src/app/api/auth"
rm -rf "/home/jryan/Heaton Web Directory Prod/src/types/next-auth.d.ts"
```

---

### Step 8: Update Admin Page (2 minutes)

Edit `src/app/admin/page.tsx`:

```typescript
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  return <AdminDashboard />
}
```

(Remove SessionProvider wrapper)

---

### Step 9: Update PendingChangesPanel - Editor Restrictions (10 minutes)

Edit `src/components/admin/PendingChangesPanel.tsx`:

Add this at the top of the component function:
```typescript
const isEditor = userRole === 'editor'
```

Wrap the approve/reject buttons in a conditional. Find this section:
```typescript
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  <input type="checkbox" ... />
  <button onClick={() => handleApprove(change.id)}>
    Approve
  </button>
  <button onClick={() => handleReject(change.id)}>
    Reject
  </button>
</div>
```

Replace with:
```typescript
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  {!isEditor && (
    <>
      <input
        type="checkbox"
        checked={selectedChanges.has(change.id)}
        onChange={() => toggleSelection(change.id)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      <button
        onClick={() => handleApprove(change.id)}
        style={{
          padding: '8px 12px',
          background: 'var(--success-color)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}
      >
        Approve
      </button>
      <button
        onClick={() => handleReject(change.id)}
        style={{
          padding: '8px 12px',
          background: 'white',
          color: 'var(--error-color)',
          border: '1px solid var(--error-color)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}
      >
        Reject
      </button>
    </>
  )}
  {isEditor && (
    <div style={{
      padding: '8px 12px',
      background: 'rgba(107, 114, 128, 0.1)',
      border: '1px solid rgba(107, 114, 128, 0.3)',
      borderRadius: '6px',
      fontSize: '12px',
      color: 'var(--secondary-text-color)',
      textAlign: 'center'
    }}>
      Awaiting Approval
    </div>
  )}
</div>
```

Also hide bulk approve for editors. Find the "Approve Selected" button and wrap it:
```typescript
{selectedChanges.size > 0 && !isEditor && (
  <button onClick={handleBulkApprove}>
    ...
  </button>
)}
```

---

### Step 10: Update API Routes with Auth Checks (15 minutes)

Edit `src/app/api/admin/publish/route.ts`:

Replace the auth section:
```typescript
// OLD:
const session = await auth()
if (!session?.user) { ... }
if (session.user.role !== 'superadmin') { ... }

// NEW:
import { getSessionFromCookie, isSuperAdmin } from '@/lib/auth-helpers'

const user = await getSessionFromCookie()
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
if (!isSuperAdmin(user)) {
  return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
}

const { author = user.name || 'Admin' } = await request.json()
```

Do the same for `src/app/api/admin/rollback/route.ts` and `src/app/api/admin/users/route.ts`.

---

### Step 11: Create Email Notification System (30 minutes)

Create `src/app/api/admin/notify-approved/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'
import { PendingChange } from '@/types/admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const PENDING_FILE = path.join(process.cwd(), 'data', 'pending-changes.json')

function getPendingChanges(): PendingChange[] {
  if (!fs.existsSync(PENDING_FILE)) return []
  return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'))
}

export async function GET() {
  try {
    const changes = getPendingChanges()
    const approvedChanges = changes.filter(c => c.status === 'approved')

    if (approvedChanges.length === 0) {
      return NextResponse.json({ message: 'No approved changes to notify about' })
    }

    // Count by type
    const addCount = approvedChanges.filter(c => c.type === 'add').length
    const editCount = approvedChanges.filter(c => c.type === 'edit').length
    const deleteCount = approvedChanges.filter(c => c.type === 'delete').length

    // Build email
    const emailBody = `
      <h2>Heaton Eye Admin Portal - Changes Ready for Review</h2>

      <p>Hi Jace,</p>

      <p>You have <strong>${approvedChanges.length} approved changes</strong> waiting to be published:</p>

      <ul>
        ${editCount > 0 ? `<li>${editCount} employee record edit${editCount > 1 ? 's' : ''}</li>` : ''}
        ${addCount > 0 ? `<li>${addCount} new employee${addCount > 1 ? 's' : ''} added</li>` : ''}
        ${deleteCount > 0 ? `<li>${deleteCount} employee${deleteCount > 1 ? 's' : ''} removed</li>` : ''}
      </ul>

      <p>
        <a href="https://staff.heatoneye.com/admin" style="background: #3182CE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Login to Publish
        </a>
      </p>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <p style="color: #6b7280; font-size: 14px;">
        Heaton Eye Admin Portal<br />
        This is an automated notification sent daily at 9:00 AM
      </p>
    `

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'Heaton Eye Admin <noreply@staff.heatoneye.com>',
      to: process.env.NOTIFICATION_EMAIL || 'jryan5150@gmail.com',
      subject: `Admin Portal: ${approvedChanges.length} Changes Ready for Review`,
      html: emailBody
    })

    if (error) {
      console.error('Email error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      approvedCount: approvedChanges.length,
      emailId: data?.id
    })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
```

Create `vercel.json` in project root:

```json
{
  "crons": [{
    "path": "/api/admin/notify-approved",
    "schedule": "0 9 * * *"
  }]
}
```

---

### Step 12: Environment Variables

Update `.env.local`:

```env
# Session Security (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-32-char-secret-here

# Email Service (get free API key from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx
NOTIFICATION_EMAIL=jryan5150@gmail.com

# Remove these OAuth vars (no longer needed):
# NEXTAUTH_URL
# NEXTAUTH_SECRET
# AZURE_AD_*
# GOOGLE_*
```

For production (Vercel dashboard), add the same variables.

---

## 📦 Deployment Checklist

### Before Deploying to Vercel:

- [ ] Test login locally with all 3 roles
- [ ] Test creating/approving/publishing changes
- [ ] Test rollback functionality
- [ ] Verify email notification (test route: `/api/admin/notify-approved`)
- [ ] Commit all changes to GitHub
- [ ] Create Resend account and get API key

### Vercel Setup:

1. Connect GitHub repo to Vercel
2. Add environment variables (SESSION_SECRET, RESEND_API_KEY, NOTIFICATION_EMAIL)
3. Deploy
4. Go to Settings → Domains → Add `staff.heatoneye.com`
5. Configure DNS in GoDaddy (CNAME: staff → cname.vercel-dns.com)
6. Wait for SSL certificate (5-10 minutes)
7. Test live site!

---

## 👥 User Credentials to Share

### Super Admin (You):
- **Email**: jryan5150@gmail.com
- **Password**: [The one you generated in Step 1]
- **Can**: Approve, Publish, Rollback, Manage Users

### Approver (M. Balderas):
- **Email**: m.balderas@heatoneye.com
- **Password**: [The one you generated in Step 1]
- **Can**: Approve/Reject changes (but cannot publish)

### Editors (Staff):
- **Email**: editor@internal
- **Password**: [Shared password you generated in Step 1]
- **Can**: Submit changes for approval only
- **Share this password** with any staff who need to propose directory updates

---

## ⏱️ Time Estimates

- **Steps 1-3**: 15 minutes (Generate hashes, update files)
- **Steps 4-6**: 25 minutes (Login page, middleware, AdminDashboard)
- **Steps 7-9**: 15 minutes (Clean up OAuth, update components)
- **Steps 10-11**: 45 minutes (API auth checks, email system)
- **Step 12**: 10 minutes (Environment variables)
- **Testing**: 20 minutes
- **Deployment**: 30 minutes

**Total**: ~2.5 hours to complete

---

## 🚀 Quick Start Commands

```bash
# Generate password hashes
cd "/home/jryan/Heaton Web Directory Prod"
npx tsx scripts/generate-password-hash.ts "YourPassword123"

# Test dev server
npm run dev

# Visit: http://localhost:3000/admin

# Deploy to Vercel
vercel --prod
```

---

## 📧 Getting Resend API Key (5 minutes)

1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day)
3. Create API Key
4. Add to `.env.local` and Vercel environment variables
5. For production emails, verify your domain in Resend settings

---

## ✅ Testing Checklist

### Local Testing:
- [ ] Login as superadmin → Can see all 4 tabs (Employees, Pending, Versions, Users)
- [ ] Login as approver → Can see 3 tabs (no Users tab)
- [ ] Login as editor → Can see all tabs but limited buttons
- [ ] Submit a change as editor
- [ ] Approve it as approver
- [ ] Publish as superadmin
- [ ] Check email notification endpoint

### Production Testing:
- [ ] All login roles work
- [ ] Main directory at `/` is public (no login)
- [ ] Admin at `/admin` requires login
- [ ] DNS resolves to staff.heatoneye.com
- [ ] SSL certificate is active
- [ ] Daily cron job runs (check Vercel logs next day)

---

## 🆘 Troubleshooting

**"Session verification failed"**
- Check SESSION_SECRET is set in environment variables
- Make sure it's the same string in local and production

**"Email not sending"**
- Verify RESEND_API_KEY is correct
- Check Resend dashboard for error logs
- Make sure NOTIFICATION_EMAIL is set

**"Login not working"**
- Verify password hashes in users.json are correct
- Check browser console for API errors
- Test API directly: `curl -X POST http://localhost:3000/api/admin/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'`

**"Middleware redirecting incorrectly"**
- Clear browser cookies
- Check that session cookie is being set (browser DevTools → Application → Cookies)

---

## 📝 Notes

- Passwords are hashed with bcrypt (10 rounds)
- Sessions last 7 days
- Sessions use JWT stored in HTTP-only cookies
- Daily emails sent at 9:00 AM server time
- Editor role can only submit changes, not approve
- Approver role can approve but not publish
- Only superadmin can publish and rollback

Good luck! 🚀
