# Claude Code Session Handoff Document

## 📍 Current Status: 50% Complete

### ✅ What's Already Done:

1. **Dependencies** (100%)
   - Removed NextAuth OAuth system
   - Installed bcryptjs, jose, resend
   - Auth utilities created in `src/lib/auth-helpers.ts`

2. **Data Structure** (100%)
   - `data/users.json` - Updated with 3 users + password hashes
   - Types updated in `src/types/admin.ts` - Added 'editor' role + passwordHash field

3. **API Routes** (100%)
   - `/api/admin/login` - POST endpoint for login
   - `/api/admin/logout` - POST endpoint for logout
   - `/api/admin/session` - GET endpoint for current user

4. **Password Hash Generator** (100%)
   - `scripts/generate-password-hash.ts` - Utility to create bcrypt hashes

### 🔨 In Progress (User is doing Steps 4-6):

User is currently working on:
- Step 4: Creating simple login page
- Step 5: Updating middleware for session-based auth
- Step 6: Updating AdminDashboard to remove OAuth

Estimated completion time: 45 minutes

### ⏳ Not Started Yet (Steps 7-12):

These are what the new Claude Code session should help with:

7. **Remove OAuth Files** (5 min)
   - Delete `src/auth.ts`
   - Delete `src/app/api/auth/` directory
   - Delete `src/types/next-auth.d.ts`

8. **Remove SessionProvider wrapper** (2 min)
   - Already done - user handled in Step 6

9. **Update PendingChangesPanel** (15 min)
   - Add editor role restrictions
   - Hide approve/reject buttons from editors
   - Hide bulk approve from editors

10. **Update API Routes with Auth Checks** (20 min)
    - Update `/api/admin/publish` to use `getSessionFromCookie`
    - Update `/api/admin/rollback` to use `getSessionFromCookie`
    - Update `/api/admin/users` to use `getSessionFromCookie`

11. **Create Email Notification System** (45 min)
    - Create `/api/admin/notify-approved` endpoint
    - Integrates with Resend email service
    - Sends daily summary of approved changes
    - Create `vercel.json` for cron job

12. **Final Testing & Deployment** (30 min)
    - Test all 3 roles locally
    - Deploy to Vercel
    - Configure Resend email
    - Test production deployment

---

## 🎯 Primary Goal

**Convert admin portal from OAuth (Microsoft/Google) to simple password-based authentication with 3 roles:**

- **Super Admin** (jryan5150@gmail.com) - Full access
- **Approver** (m.balderas@heatoneye.com) - Can approve, can't publish
- **Editor** (shared account) - Can submit changes, can't approve

---

## 📊 Architecture Overview

### Authentication Flow:
1. User visits `/admin` → Middleware checks for session cookie
2. No cookie → Redirect to `/admin/login`
3. User enters email + password
4. `/api/admin/login` verifies password against `data/users.json`
5. On success → Creates JWT session token
6. Sets HTTP-only cookie `admin-session`
7. Redirects to `/admin` dashboard

### Session Management:
- JWT tokens stored in HTTP-only cookies
- 7-day expiration
- Signed with `SESSION_SECRET` env var
- Library: `jose` (lightweight JWT)

### Password Security:
- Passwords hashed with bcrypt (10 rounds)
- Stored in `data/users.json` as `passwordHash` field
- Never stored or transmitted in plain text

### Role-Based Access:
- Checked in middleware for route protection
- Checked in components for UI visibility
- Checked in API routes for action authorization

---

## 📁 Key Files & Their Status

### Created & Complete:
- ✅ `src/lib/auth-helpers.ts` - Auth utilities
- ✅ `src/app/api/admin/login/route.ts` - Login endpoint
- ✅ `src/app/api/admin/logout/route.ts` - Logout endpoint
- ✅ `src/app/api/admin/session/route.ts` - Get current user
- ✅ `scripts/generate-password-hash.ts` - Password hasher
- ✅ `data/users.json` - User database with hashes
- ✅ `src/types/admin.ts` - Updated with editor role + passwordHash

### User Is Updating (Steps 4-6):
- 🔄 `src/app/admin/login/page.tsx` - Login UI
- 🔄 `src/middleware.ts` - Session-based auth
- 🔄 `src/components/admin/AdminDashboard.tsx` - Remove OAuth hooks
- 🔄 `src/app/admin/page.tsx` - Remove SessionProvider

### Needs Updates (Steps 7-12):
- ⏳ `src/components/admin/PendingChangesPanel.tsx` - Add editor restrictions
- ⏳ `src/app/api/admin/publish/route.ts` - Replace NextAuth with session check
- ⏳ `src/app/api/admin/rollback/route.ts` - Replace NextAuth with session check
- ⏳ `src/app/api/admin/users/route.ts` - Replace NextAuth with session check
- ⏳ `src/app/api/admin/notify-approved/route.ts` - **CREATE NEW** - Email notifications
- ⏳ `vercel.json` - **CREATE NEW** - Cron job config

### Should Be Deleted:
- ❌ `src/auth.ts` - Old NextAuth config
- ❌ `src/app/api/auth/` - Old NextAuth routes
- ❌ `src/types/next-auth.d.ts` - Old type definitions

---

## 🔑 Environment Variables

### Local (.env.local):
```env
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
RESEND_API_KEY=<from-resend.com>
NOTIFICATION_EMAIL=jryan5150@gmail.com
```

### Production (Vercel):
Same as local, but with production Resend API key

### No Longer Needed:
```
# These can be removed:
NEXTAUTH_URL
NEXTAUTH_SECRET
AZURE_AD_CLIENT_ID
AZURE_AD_CLIENT_SECRET
AZURE_AD_TENANT_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

---

## 🧪 Testing Checklist

### Local Testing (after Steps 4-6):
- [ ] Visit `/admin` → Redirects to `/admin/login`
- [ ] Login with superadmin credentials → Success
- [ ] See all 4 tabs (Employees, Pending, Versions, Users)
- [ ] Sign out → Returns to login
- [ ] Login with approver → Only 3 tabs (no Users)
- [ ] Login with editor → All tabs but limited buttons

### Production Testing (after deployment):
- [ ] Main directory at `/` is public
- [ ] Admin at `/admin` requires login
- [ ] DNS resolves staff.heatoneye.com
- [ ] SSL certificate active
- [ ] All 3 roles work
- [ ] Email notification test (manually trigger `/api/admin/notify-approved`)

---

## 💬 User Context & Decisions

**User:** Jace Ryan (jryan5150@gmail.com)
**Client:** Heaton Eye
**Project:** Employee directory with admin portal

**Key Decisions Made:**
1. ✅ Pivoted from OAuth to simple password auth
2. ✅ Main directory at `/` is public (no login required)
3. ✅ Admin portal at `/admin` is password-protected
4. ✅ 3-tier role system: superadmin → approver → editor
5. ✅ M. Balderas is the sole approver (for now)
6. ✅ Shared password for editors (staff)
7. ✅ Daily email summaries (not immediate notifications)
8. ✅ Email via Resend service
9. ✅ Deploy to Vercel at staff.heatoneye.com

**Deployment Timeline:**
- Steps 1-6 (Quick Demo): ~1 hour → Can share admin link
- Steps 7-12 (Full System): ~2.5 hours → Complete with emails

**Current Goal:**
Get Steps 1-6 done first for a quick demo deployment, then new Claude session for Steps 7-12 (email notifications + polish).

---

## 🚀 When New Session Starts

**User will have completed Steps 1-6** and will need help with:

### Priority 1: Clean Up OAuth (15 min)
- Delete old auth files
- Update PendingChangesPanel with editor restrictions

### Priority 2: Fix API Route Auth (20 min)
- Replace `auth()` calls with `getSessionFromCookie()`
- Update publish, rollback, users routes

### Priority 3: Email Notifications (45 min)
- Create notify-approved endpoint
- Set up Resend integration
- Create vercel.json cron config
- Test email delivery

### Priority 4: Final Polish (30 min)
- Test all roles thoroughly
- Fix any bugs
- Deploy to production
- Verify emails work

---

## 📝 Important Notes for New Claude

1. **Authentication is now JWT-based**, not OAuth
   - Use `getSessionFromCookie()` to get current user
   - Use role helpers: `isSuperAdmin()`, `canApprove()`, `canPublish()`

2. **All old NextAuth imports should be removed**
   - No more `useSession()` hook
   - No more `signIn()` / `signOut()` from next-auth
   - No more `SessionProvider` wrapper

3. **Middleware is critical**
   - Must use `getSessionFromRequest()` for session checks
   - Cannot use `fs` or `path` in middleware (edge runtime)

4. **Three distinct roles with clear permissions:**
   - Superadmin: Everything
   - Approver: Approve/reject only (no publish, no user management)
   - Editor: Submit changes only (no approve, no publish)

5. **Email system uses Resend**
   - Free tier: 100 emails/day (plenty for daily summaries)
   - Cron runs at 9:00 AM daily
   - Only sends if there are approved changes

6. **User passwords** (generated and stored in users.json):
   - Superadmin: `HeatonAdmin2025!`
   - Approver: `Balderas2025!`
   - Editor: `HeatonEditor2025`

---

## 📚 Reference Documents

All documentation is in the project root:

- `IMPLEMENTATION-GUIDE.md` - Complete step-by-step guide (all 12 steps)
- `QUICK-DEPLOY-STEPS.md` - Just Steps 4-6 for user to do now
- `CLAUDE-SESSION-HANDOFF.md` - This file (session context)

---

## 🎯 Success Criteria

When the new Claude session completes Steps 7-12:

✅ All OAuth code removed
✅ Editor role properly restricted in UI
✅ All API routes use session-based auth
✅ Email notifications working with Resend
✅ Cron job configured in vercel.json
✅ Tested locally with all 3 roles
✅ Deployed to staff.heatoneye.com
✅ DNS configured and SSL active
✅ Email test successful (daily summary)

---

## 🆘 Common Issues & Solutions

**Issue:** "Session not found" on /admin
- Solution: Check SESSION_SECRET is set in .env.local

**Issue:** Login fails with correct password
- Solution: Verify password hash in users.json matches generated hash

**Issue:** Middleware error about 'fs' module
- Solution: Don't import fs/path in middleware (edge runtime limitation)

**Issue:** Email not sending
- Solution: Check RESEND_API_KEY is valid, verify email in Resend dashboard

**Issue:** Cron not running
- Solution: vercel.json must be in project root, redeploy after adding it

---

Good luck with the new session! 🚀

The project is in great shape - just needs the finishing touches for email notifications and final deployment testing.
