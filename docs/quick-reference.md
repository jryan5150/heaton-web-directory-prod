# Heaton Eye Admin Portal - Quick Reference Guide

**Version 2.0** | **Portal URL:** https://staff.heatoneye.com/admin

---

## Signing In

**Microsoft Sign-In (Recommended):** Click "Sign in with Microsoft" and use your @heatoneye.com account.

**Email & Password (Fallback):** Enter your email and password in the form below the Microsoft button.

---

## User Roles

### Super Admin (Full Access)
- Publish changes, manage users, manage IP allow list, manage sync mappings

### Approver (Review & Approve)
- Can approve or reject pending changes
- Cannot publish, manage users, or manage IPs

### Editor (Submit Changes)
- Can submit new employees, edits, and deletions
- All submissions require approval

---

## Role Permissions Matrix

| Action                    | Super Admin | Approver | Editor |
|---------------------------|:-----------:|:--------:|:------:|
| View Employees            |      ✅     |    ✅    |   ✅   |
| Submit Changes            |      ✅     |    ✅    |   ✅   |
| Approve/Reject Changes    |      ✅     |    ✅    |   ❌   |
| Upload Nextiva CSV        |      ✅     |    ✅    |   ✅   |
| Publish Changes           |      ✅     |    ❌    |   ❌   |
| Manage IP Allow List      |      ✅     |    ❌    |   ❌   |
| Manage Sync Mappings      |      ✅     |    ❌    |   ❌   |
| Rollback Versions         |      ✅     |    ❌    |   ❌   |
| Manage Users              |      ✅     |    ❌    |   ❌   |

---

## Approval Workflow

1. **EDITOR** submits change → Status: Pending Review
2. **APPROVER** reviews → Approves or Rejects
3. If approved → Status: Ready to Publish
4. **SUPER ADMIN** publishes → Live on staff.heatoneye.com

---

## Nextiva Sync

**Upload CSV:** Nextiva Sync tab → Choose File → Upload & Sync

The sync engine automatically:
- Matches employees by email, manual mapping, or name
- Updates extensions, phone numbers, and locations
- Filters out rooms, devices, and fax lines
- Queues unmatched people for review in Pending Changes

**Automated:** A daily sync runs on weekday mornings automatically.

**Manual Mappings (Super Admin):** When emails don't match, add a manual mapping:
Nextiva Sync tab → Manual Email Mappings → Add Mapping

---

## IP Allow List (Super Admin)

The public directory is restricted to office networks. Manage allowed IPs:

**View:** IP Allow List tab → IPs grouped by location

**Add:** IP Allow List tab → Add IP → Enter address and location

**Remove:** Click red trash icon → Confirm removal

---

## Common Tasks

### For Editors

**Submit New Employee**
Employees Tab → Add New Employee → Fill Form → Submit

**Edit Employee**
Employees Tab → Find Employee → Edit → Submit

### For Approvers

**Approve/Reject Change**
Pending Changes Tab → Review → Click Approve or Reject

**Bulk Approve**
Pending Changes → Check boxes → Approve Selected

---

## Change Types

| Badge | Type | Description |
|-------|------|-------------|
| ADD | New employee being added to directory |
| EDIT | Existing employee information being updated |
| DELETE | Employee being removed from directory |

---

## Troubleshooting Quick Fixes

### Microsoft sign-in says "Access denied"?
→ Your account must be pre-registered by a Super Admin

### Can't log in with email/password?
→ Verify credentials. If SSO-only, use Microsoft button

### Directory shows "Access Restricted"?
→ You must be on an approved office network
→ Admin portal works from anywhere: staff.heatoneye.com/admin

### Nextiva sync has unmatched records?
→ Check Pending Changes tab for queued reviews
→ Super Admin can add manual email mappings

### Changes not on live site?
→ Must be published, not just approved
→ Hard refresh browser: Ctrl+F5

---

## Important URLs

| Purpose | URL |
|---------|-----|
| Admin Portal | https://staff.heatoneye.com/admin |
| Login Page | https://staff.heatoneye.com/admin/login |
| Public Directory | https://staff.heatoneye.com |

---

## Security Reminders

- Use Microsoft sign-in when possible (more secure)
- Log out when finished
- Don't share credentials
- Sessions expire after 7 days
- Double-check data before submitting

---

## Support

**Email:** tickets@heatoneye.com

---

**Quick Reference Guide v2.0**
