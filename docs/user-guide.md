# Heaton Eye Staff Directory — Admin Portal User Guide

**Version 3.0** | Last Updated: March 2025
**Portal URL:** https://staff.heatoneye.com/admin

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Signing In](#signing-in)
3. [Role-Specific Instructions](#role-specific-instructions)
   - [Super Admin Guide](#super-admin-guide)
   - [Approver Guide](#approver-guide)
   - [Editor Guide](#editor-guide)
4. [Approval Workflow](#approval-workflow)
5. [Nextiva Sync](#nextiva-sync)
6. [IP Allow List Management](#ip-allow-list-management)
7. [Email Notifications](#email-notifications)
8. [Version History & Rollback](#version-history--rollback)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## System Overview

The Heaton Eye Admin Portal manages the public employee directory at https://staff.heatoneye.com. Changes to the directory flow through a three-stage approval workflow to ensure accuracy before anything goes live.

The public directory is restricted to office networks — employees can access it from Athens, Tyler, Gun Barrel City, and Longview office locations. The admin portal is accessible from any device and network.

### How Changes Flow

```
EDITOR              APPROVER            SUPER ADMIN
  │                    │                    │
  ├─ Submits ─────────►│                    │
  │                    ├─ Approves ────────►│
  │                    │                    ├─ Publishes to Live
  │                    │                    │
  │                    └─ Rejects           │
  │                       (notifies editor) │
```

### Tab Access by Role

|                  | Super Admin | Approver | Editor |
|------------------|:-----------:|:--------:|:------:|
| Employees        |     Yes     |   Yes    |  Yes   |
| Pending Changes  |     Yes     |   Yes    |  Yes   |
| Version History  |     Yes     |   Yes    |  Yes   |
| Nextiva Sync     |     Yes     |   Yes    |  Yes   |
| IP Allow List    |     Yes     |   No     |  No    |
| Users            |     Yes     |   No     |  No    |

---

## Signing In

1. Go to https://staff.heatoneye.com/admin/login
2. Enter your email address and password
3. Click **Sign In**

Sessions remain active for 7 days. You will be automatically redirected to login if your session expires.

If you do not have credentials or have forgotten your password, contact your Super Admin.

---

## Role-Specific Instructions

---

### Super Admin Guide

Full access to all features.

**Responsibilities:**
- Publish approved changes to the live directory
- Manage user accounts and passwords
- Manage the IP Allow List
- Configure Nextiva sync email mappings
- Roll back versions if needed

**Unique capabilities:**
- Only role that can publish changes to the live directory
- Only role that receives daily email notifications about approved changes waiting to publish
- Only role that can create, edit, or remove user accounts

---

### Approver Guide

Review and approve changes submitted by Editors before they can be published.

**What you can do:**
- View all employees in the directory
- Approve or reject pending changes
- Bulk approve multiple changes at once
- View version history
- Upload Nextiva CSV files

**What you cannot do:**
- Publish changes to the live directory (Super Admin only)
- Manage user accounts or IP Allow List (Super Admin only)

#### Reviewing a Change

1. Click the **Pending Changes** tab
2. Review each submission:
   - **ADD** — New employee being added
   - **EDIT** — Existing employee info being updated (before/after comparison shown)
   - **DELETE** — Employee being removed
3. Click **Approve** if the change is correct
4. Click **Reject** if the change has errors or should not go live

Once approved, the change moves to "Approved & Ready to Publish" and waits for the Super Admin to publish.

#### Bulk Approving Changes

1. Check the checkbox next to each valid change
2. Click **Approve Selected (X)**
3. All selected changes move to approved status at once

---

### Editor Guide

Submit proposed changes to the directory. All submissions require approval before they appear on the live site.

**What you can do:**
- View all employees in the directory
- Submit additions, edits, and deletions for review
- View the status of changes you submitted
- Upload Nextiva CSV files

**What you cannot do:**
- Approve or reject changes (Approver or Super Admin only)
- Publish changes (Super Admin only)
- Manage users or IP Allow List

#### Adding a New Employee

1. Click the **Employees** tab
2. Click **Add New Employee**
3. Fill in the required fields:
   - First Name
   - Last Name
   - Email
   - Extension
   - Location (Tyler, Athens, Longview, or Gun Barrel City)
   - Title (optional)
4. Click **Submit for Approval**

The change will appear in the Pending Changes tab with an "Awaiting Approval" status until an Approver reviews it.

#### Editing an Employee

1. Click the **Employees** tab
2. Find the employee and click **Edit**
3. Update the necessary fields
4. Click **Submit for Approval**

#### Removing an Employee

1. Click the **Employees** tab
2. Find the employee and click **Delete**
3. Confirm the deletion

The deletion request goes into pending review — the employee stays on the live directory until an Approver approves it and a Super Admin publishes it.

---

## Approval Workflow

### The Four Steps

**Step 1 — Submission (Editor)**

The Editor submits a change from the Employees tab. The change is saved as "Pending" and appears in the Pending Changes tab. The employee record on the live directory is not yet affected.

**Step 2 — Review (Approver or Super Admin)**

The Approver opens the Pending Changes tab and reviews the change. The before/after comparison is shown for edits. The Approver clicks Approve or Reject.

**Step 3 — Approval**

- If approved: The change moves to "Approved & Ready to Publish"
- If rejected: The change moves to the Rejected section (greyed out)
- The Super Admin receives a daily email when approved changes are waiting

**Step 4 — Publish (Super Admin)**

The Super Admin clicks **Publish X Approved Changes**. All approved changes are applied to the live directory at once. A version snapshot is automatically created, and the published changes are removed from the pending list.

---

## Nextiva Sync

The Nextiva Sync tab keeps the employee directory in sync with the Nextiva phone system. Upload a CSV export from Nextiva, and the system automatically matches employees and updates their extensions, phone numbers, and locations.

### Uploading a CSV

1. Export a Users CSV from the Nextiva admin portal
2. Click the **Nextiva Sync** tab
3. Click **Choose File** and select the CSV
4. Click **Upload & Sync**
5. Review the results:
   - **Matched** — Employees found in both systems
   - **Updated** — Employees whose data was changed
   - **Created** — New people queued as pending changes for review
   - **Skipped** — Non-person entries (rooms, devices, fax lines) filtered out
   - **Errors** — Rows that could not be processed

Click the collapsible sections to see detailed breakdowns of each category.

### Automated Daily Sync

A daily automated sync runs on weekday mornings. The sync history will show "AUTO" for automated runs. No action is required.

### Manual Email Mappings

When the sync cannot match a Nextiva record to an employee (for example, because the email addresses differ), a Super Admin can add a manual mapping.

1. In the **Manual Email Mappings** section, enter:
   - **Nextiva Email** — The email as it appears in the Nextiva CSV
   - **Employee** — Select the correct employee from the dropdown
   - **Notes** — Optional explanation for the mapping
2. Click **Add Mapping**

Future syncs will use this mapping automatically.

---

## IP Allow List Management

*Super Admin only*

The public directory at staff.heatoneye.com is restricted to approved office IP addresses. Employees on other networks will see an access-restricted page.

### Adding an IP Address

1. Click the **IP Allow List** tab
2. Click **Add IP**
3. Enter the IPv4 address (e.g., 12.156.3.90)
4. Select the office location or enter a custom location name
5. Optionally add a note (e.g., "Main office router")
6. Click **Add IP Address**

### Removing an IP Address

1. Find the IP in the list
2. Click the red trash icon
3. Confirm the removal

Removing an IP immediately blocks that network from accessing the public directory. Verify you are not removing an IP that is still in active use.

### Current Office IPs

| Location        | IP Addresses                        |
|-----------------|-------------------------------------|
| Athens          | 4.36.173.10, 66.76.57.122           |
| Tyler           | 12.156.3.90, 75.110.177.134         |
| Gun Barrel City | 209.245.234.34, 209.33.56.59        |
| Longview        | 12.164.166.172, 206.255.14.253      |

---

## Email Notifications

The Super Admin receives an automated daily email when approved changes are waiting to be published.

**Schedule:** Every day at 9:00 AM UTC (4:00 AM CST / 3:00 AM CDT)

**Conditions:** Email is only sent if approved changes exist. No email is sent on days when nothing is waiting.

**Contents:**
- Number of approved changes waiting
- Breakdown by type (Add, Edit, Delete)
- Direct link to the admin portal

---

## Version History & Rollback

Every time the Super Admin publishes a batch of changes, the system creates a version snapshot of the full employee list.

### Viewing Version History

1. Click the **Version History** tab
2. Each version shows:
   - Date and time published
   - Who published it
   - How many employees were in the directory at that time

### Rolling Back

*Super Admin only*

If a publish introduced errors, the Super Admin can roll back to a previous version:

1. Click **Version History**
2. Find the version to restore
3. Click **Rollback to This Version**
4. Confirm

Rollback immediately restores the live directory to the selected snapshot. A new version entry is created to record the rollback.

---

## Troubleshooting

### Cannot log in

- Verify that your email address is entered correctly (case-sensitive)
- Verify that your password is correct (case-sensitive)
- If you have forgotten your password, contact your Super Admin

### Directory shows "Access Restricted"

The public directory is only accessible from approved office networks. You must be connected to one of the Heaton Eye office networks to view it.

The admin portal has no IP restriction — it is accessible from any device and network at staff.heatoneye.com/admin.

If you are in the office and still blocked, the office IP address may have changed. Contact your Super Admin to add the new IP.

### Do not see the Approve or Reject buttons

Only Approvers and Super Admins can approve or reject changes. Editors see an "Awaiting Approval" badge instead. If you need approval access, contact your Super Admin.

### Do not see the Publish button

Only the Super Admin can publish changes. Approvers will see a status message indicating how many changes are waiting for the Super Admin to publish.

### Do not see the IP Allow List or Users tabs

These tabs are visible to Super Admins only. This is expected behavior.

### Changes not appearing on the live directory

1. Confirm that the changes have been **published**, not just approved. Check the Pending Changes tab — if items are still listed under "Approved & Ready to Publish," they have not been published yet.
2. Try a hard refresh: **Ctrl+Shift+R** (Windows / Linux) or **Cmd+Shift+R** (Mac)
3. Allow up to 30 seconds for the cache to clear after publishing

### Nextiva sync shows unmatched records

Unmatched records appear as pending changes in the Pending Changes tab for manual review. If the same Nextiva email keeps appearing unmatched, a Super Admin can add a manual email mapping in the Nextiva Sync tab so future syncs handle it automatically.

---

## Security Best Practices

### Passwords

- Use a unique password that is not reused across other accounts
- Use 12 or more characters including uppercase, lowercase, numbers, and symbols
- Contact your Super Admin if your password needs to be changed

### Account Usage

- Log out when you finish using the portal, especially on shared devices
- Do not share your credentials with others
- If using the Editor shared account, use it only for directory changes and log out promptly
- Report any unusual activity to your Super Admin immediately

### Sessions

- Sessions expire after 7 days
- After expiration, you will need to log in again

### Data Accuracy

- Double-check all field values before submitting a change
- If you submit a change with incorrect data, inform your Approver to reject it so you can resubmit
- The version history maintains a full audit trail of all published changes

---

## Support

For technical support or access questions, contact your Super Admin or submit a ticket at:

**Email:** tickets@heatoneye.com
