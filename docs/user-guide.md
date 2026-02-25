# Heaton Eye Staff Directory - Admin Portal User Guide

**Version 2.0** | Last Updated: February 2025
**Portal URL:** https://staff.heatoneye.com/admin

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Signing In](#signing-in)
3. [Role-Specific Instructions](#role-specific-instructions)
   - [Approver Guide](#approver-guide)
   - [Editor Guide](#editor-guide)
4. [Approval Workflow](#approval-workflow)
5. [Nextiva Sync](#nextiva-sync)
6. [IP Allow List Management](#ip-allow-list-management)
7. [Email Notifications](#email-notifications)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## System Overview

The Heaton Eye Admin Portal manages the public employee directory at https://staff.heatoneye.com. Changes flow through a three-stage approval workflow to ensure accuracy.

The public directory is restricted to office networks only — employees can access it from Athens, Tyler, Gun Barrel City, and Longview office locations. The admin portal is accessible from anywhere via Microsoft sign-in.

### Approval Workflow Diagram

```
EDITOR          APPROVER         SUPER ADMIN
  │                │                  │
  ├─ Submits ────►│                  │
  │                ├─ Approves ─────►│
  │                │                  ├─ Publishes
  │                │                  │
  │                └─ Rejects ───────┘
```

### Available Tabs (by Role)

|                    | Super Admin | Approver | Editor |
|--------------------|:-----------:|:--------:|:------:|
| Employees          |      ✅     |    ✅    |   ✅   |
| Pending Changes    |      ✅     |    ✅    |   ✅   |
| Version History    |      ✅     |    ✅    |   ✅   |
| Nextiva Sync       |      ✅     |    ✅    |   ✅   |
| IP Allow List      |      ✅     |    ❌    |   ❌   |
| Users Management   |      ✅     |    ❌    |   ❌   |

---

## Signing In

The admin portal supports two sign-in methods:

### Microsoft Sign-In (Recommended)

1. Go to https://staff.heatoneye.com/admin/login
2. Click **"Sign in with Microsoft"**
3. You will be redirected to the Microsoft login page
4. Sign in with your @heatoneye.com Microsoft 365 account
5. You will be automatically redirected back to the admin portal

**Note:** Only accounts that have been pre-registered in the admin portal can sign in. If you see "Access denied," contact your administrator.

### Email & Password (Fallback)

If Microsoft sign-in is unavailable:

1. Go to https://staff.heatoneye.com/admin/login
2. Scroll down to the "or sign in with email" section
3. Enter your email and password
4. Click **"Sign In"**

---

## Role-Specific Instructions

---

### Approver Guide

**Review & Approve Only**

#### What You Can Do
- ✅ View all employees in the directory
- ✅ Approve or reject pending changes
- ✅ View version history
- ✅ Upload Nextiva CSV files and view sync history
- ❌ Cannot publish changes (Super Admin only)
- ❌ Cannot manage users or IP allow list (Super Admin only)

#### Common Tasks

**Review & Approve Changes**

1. Click "Pending Changes" tab
2. Review each submission carefully:
   - **ADD:** New employee being added
   - **EDIT:** Existing employee info being updated
   - **DELETE:** Employee being removed
3. Click "Approve" if change is correct
4. Click "Reject" if change has errors
5. Approved changes wait for Super Admin to publish

**Bulk Approve Multiple Changes**

1. Check the checkbox next to each valid change
2. Click "Approve Selected (X)" button
3. All selected changes move to approved status

#### What Happens After You Approve?

- Changes move to "Approved & Ready to Publish" section
- You'll see message: "X changes ready for Super Admin to publish"
- Super Admin receives daily email notification
- Super Admin will publish changes to live directory

---

### Editor Guide

**Submit Changes Only**

#### What You Can Do
- ✅ View all employees in the directory
- ✅ Submit new employee additions
- ✅ Submit edits to existing employees
- ✅ Submit employee removals
- ✅ View pending changes you submitted
- ✅ Upload Nextiva CSV files
- ❌ Cannot approve or reject changes
- ❌ Cannot publish changes
- ❌ Cannot manage users

#### Common Tasks

**Add New Employee**

1. Click "Employees" tab
2. Click "Add New Employee" button
3. Fill in all required fields:
   - First Name
   - Last Name
   - Email
   - Extension
   - Location (Tyler, Athens, Longview, Gun Barrel City)
   - Title (optional)
4. Click "Submit for Approval"
5. Change appears in "Pending Changes" tab with "Awaiting Approval" badge

**Edit Existing Employee**

1. Click "Employees" tab
2. Find the employee to edit
3. Click "Edit" button
4. Update the necessary fields
5. Click "Submit for Approval"
6. Change goes to pending review

**Delete Employee**

1. Click "Employees" tab
2. Find the employee to remove
3. Click "Delete" button
4. Confirm deletion
5. Deletion request goes to pending review

---

## Approval Workflow

### Step-by-Step Process

**Step 1: SUBMISSION (Editor)**
- Editor makes a change in the Employees tab
- Change is saved as "pending" status
- Change appears in Pending Changes tab

**Step 2: REVIEW (Approver or Super Admin)**
- Reviewer sees change in "Pending Review" section
- Reviewer examines before/after data
- Reviewer clicks "Approve" or "Reject"

**Step 3: APPROVAL (Approver or Super Admin)**
- If approved: Change moves to "Approved & Ready to Publish"
- If rejected: Change moves to "Rejected" section (greyed out)
- Email notification sent to Super Admin (daily at 9:00 AM)

**Step 4: PUBLISH (Super Admin Only)**
- Super Admin clicks "Publish X Approved Changes"
- All approved changes apply to live directory
- Version snapshot created automatically
- Published changes removed from pending list

---

## Nextiva Sync

The **Nextiva Sync** tab allows you to keep the employee directory in sync with the Nextiva phone system. You can upload a CSV export from Nextiva, and the system will automatically update employee extensions, phone numbers, and locations.

### How It Works

1. Export a Users CSV file from the Nextiva admin portal
2. Upload the CSV using the **Nextiva Sync** tab
3. The sync engine processes each row:
   - **Matched employees** are auto-updated with new extension, phone, and location data
   - **Unmatched real people** are queued as pending changes for admin review
   - **Non-person entries** (rooms, devices, fax lines) are automatically filtered out

### Uploading a CSV

1. Click the **"Nextiva Sync"** tab
2. Click **"Choose File"** and select the Nextiva CSV export
3. Click **"Upload & Sync"**
4. Review the results:
   - **Matched**: Employees found in both systems
   - **Updated**: Employees whose data was changed
   - **Created**: New people queued for review
   - **Skipped**: Non-person entries filtered out
   - **Errors**: Rows that couldn't be processed

5. Click the collapsible sections to see detailed breakdowns

### Sync History

Below the upload area, you'll see a history of the last 10 sync operations. Each entry shows:
- When the sync ran
- Whether it was manual (you uploaded) or automated (daily schedule)
- How many rows were processed and the results

### Automated Daily Sync

A daily automated sync runs on weekday mornings. This scrapes the latest data from Nextiva and uploads it automatically. No action is needed from you — the sync history will show "AUTO" for these runs.

### Manual Email Mappings (Super Admin Only)

When the sync can't match a Nextiva record to an employee (e.g., because the email addresses differ), Super Admins can create manual mappings:

1. In the "Manual Email Mappings" section, enter:
   - **Nextiva Email**: The email address as it appears in the Nextiva CSV
   - **Employee**: Select the correct employee from the dropdown
   - **Notes**: (Optional) Why this mapping exists
2. Click **"Add Mapping"**
3. Future syncs will use this mapping automatically

---

## IP Allow List Management

*(Super Admin Only)*

The public directory at staff.heatoneye.com is restricted to specific office IP addresses. Only users on approved office networks can view the directory.

### Viewing the IP Allow List

1. Click the **"IP Allow List"** tab
2. IPs are grouped by office location (Athens, Tyler, Gun Barrel City, Longview)
3. Stats cards at the top show the count per location

### Adding an IP Address

1. Click **"Add IP"** button
2. Enter the IPv4 address (e.g., 12.156.3.90)
3. Select the office location from the dropdown, or click "Custom" to enter a new location
4. Optionally add notes (e.g., "Main office router")
5. Click **"Add IP Address"**

### Removing an IP Address

1. Find the IP you want to remove
2. Click the red trash icon
3. Confirm the removal

**Warning:** Removing an IP will immediately block that network from accessing the public directory. Make sure you're not removing an IP that's still in use.

### Current Office IPs

| Location | IP Addresses |
|----------|-------------|
| Athens | 4.36.173.10, 66.76.57.122 |
| Tyler | 12.156.3.90, 75.110.177.134 |
| Gun Barrel City | 209.245.234.34, 209.33.56.59 |
| Longview | 12.164.166.172, 206.255.14.253 |

---

## Email Notifications

### Who Receives Emails?
- Currently, the Super Admin receives email notifications when approved changes are ready to be published

### When Are Emails Sent?
- Daily at 9:00 AM UTC (3:00 AM CST / 4:00 AM CDT)
- Only if approved changes are waiting to be published
- No email if no approved changes exist

### What's in the Email?
- Count of approved changes waiting
- Breakdown by type (Add, Edit, Delete)
- Direct link to admin portal

---

## Troubleshooting

### Microsoft sign-in says "Access denied"

**Solution:**
- Your Microsoft account must be pre-registered in the admin portal
- Contact your Super Admin to add your account
- Only @heatoneye.com accounts are supported

### Can't log in with email/password

**Solution:**
- Verify email address is correct (case-sensitive)
- Verify password is exact (case-sensitive, includes special chars)
- If your account was set up for Microsoft sign-in only, you must use the "Sign in with Microsoft" button

### Directory shows "Access Restricted" page

**Solution:**
- The public directory is restricted to office networks only
- You must be on one of the approved office IPs
- If you're in the office and still blocked, your office IP may have changed — contact your Super Admin
- The admin portal is accessible from anywhere — use staff.heatoneye.com/admin

### Nextiva sync shows unexpected results

**Solution:**
- Make sure you're uploading the correct CSV file (Users export from Nextiva)
- The CSV must have a "Name" column
- Non-person entries (rooms, devices, fax lines) are automatically filtered out
- Unmatched people appear in the Pending Changes tab for review

### Don't see "Approve" button on pending changes

**Solution:**
- Check your role: Editors cannot approve changes
- Editor role sees "Awaiting Approval" badge instead
- Only Approvers and Super Admins can approve

### Don't see "Publish" button

**Solution:**
- Only Super Admin can publish changes
- Approvers will see message about waiting for Super Admin

### Don't see "IP Allow List" or "Users" tabs

**Solution:**
- Only Super Admin has access to these management features
- This is expected behavior for security

### Changes not appearing on public directory

**Solution:**
- Verify changes have been published (not just approved)
- Check staff.heatoneye.com to confirm
- Try hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Allow 30 seconds for cache to clear

---

## Security Best Practices

### Password Security
- Change default passwords after first login
- Use strong, unique passwords (12+ characters)
- Prefer Microsoft sign-in over email/password for better security

### Account Security
- Log out when finished using the portal
- Don't share login credentials
- Report suspicious activity immediately
- Use private/incognito browser on shared computers

### Session Management
- Sessions expire after 7 days of inactivity
- You'll need to log in again after expiration

### Data Protection
- Only submit accurate employee information
- Double-check data before submitting
- Don't submit personal/sensitive information beyond directory needs
- Version history maintains audit trail

---

## Support Contact

For technical support or questions about the admin portal:

**Email:** tickets@heatoneye.com

For Heaton Eye-specific questions, contact your internal IT department or authorized admin.

---

**End of User Guide**
