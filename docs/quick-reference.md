# Heaton Eye Admin Portal — Quick Reference

**Version 3.0** | **Portal URL:** https://staff.heatoneye.com/admin

---

## Signing In

Go to https://staff.heatoneye.com/admin/login and enter your email and password.

Sessions stay active for 7 days. Contact your Super Admin if you need credentials or a password reset.

---

## Role Permissions

| Action                  | Super Admin | Approver | Editor |
|-------------------------|:-----------:|:--------:|:------:|
| View Employees          |     Yes     |   Yes    |  Yes   |
| Submit Changes          |     Yes     |   Yes    |  Yes   |
| Approve / Reject        |     Yes     |   Yes    |  No    |
| Upload Nextiva CSV      |     Yes     |   Yes    |  Yes   |
| Publish Changes         |     Yes     |   No     |  No    |
| Rollback Versions       |     Yes     |   No     |  No    |
| Manage IP Allow List    |     Yes     |   No     |  No    |
| Manage Sync Mappings    |     Yes     |   No     |  No    |
| Manage Users            |     Yes     |   No     |  No    |

---

## Approval Workflow

```
1. EDITOR submits change       → Status: Pending Review
2. APPROVER reviews            → Approves or Rejects
3. Approved                    → Status: Ready to Publish
4. SUPER ADMIN publishes       → Live on staff.heatoneye.com
```

---

## Common Tasks

### Editor — Submit a Change

| Task           | Steps                                              |
|----------------|----------------------------------------------------|
| Add employee   | Employees → Add New Employee → Fill form → Submit  |
| Edit employee  | Employees → Find employee → Edit → Submit          |
| Delete employee| Employees → Find employee → Delete → Confirm       |

### Approver — Review Changes

| Task          | Steps                                                   |
|---------------|---------------------------------------------------------|
| Approve one   | Pending Changes → Review → Approve                      |
| Reject one    | Pending Changes → Review → Reject                       |
| Bulk approve  | Pending Changes → Check boxes → Approve Selected        |

### Super Admin — Publish

| Task                | Steps                                                    |
|---------------------|----------------------------------------------------------|
| Publish changes     | Pending Changes → Publish X Approved Changes             |
| Roll back version   | Version History → Find version → Rollback                |
| Add IP address      | IP Allow List → Add IP → Enter address and location      |
| Remove IP address   | IP Allow List → Trash icon → Confirm                     |
| Add user            | Users → Add User → Fill form → Save                      |
| Add sync mapping    | Nextiva Sync → Manual Email Mappings → Add Mapping       |

---

## Change Type Badges

| Badge  | Meaning                               |
|--------|---------------------------------------|
| ADD    | New employee being added              |
| EDIT   | Existing employee info being updated  |
| DELETE | Employee being removed                |

---

## Nextiva Sync

**Upload CSV:** Nextiva Sync tab → Choose File → Upload & Sync

The sync engine automatically:
- Matches employees by email, manual mapping, or name
- Updates extensions, phone numbers, and locations
- Filters out rooms, devices, and fax lines
- Queues unmatched people as pending changes for review

**Automated:** A daily sync runs on weekday mornings automatically.

**Manual mappings (Super Admin):** When emails don't match across systems, add a manual mapping:
Nextiva Sync → Manual Email Mappings → Add Mapping

---

## Quick Troubleshooting

| Problem                              | Fix                                                                  |
|--------------------------------------|----------------------------------------------------------------------|
| Cannot log in                        | Verify email and password. Contact Super Admin for a reset.          |
| Directory shows "Access Restricted"  | Must be on an approved office network. Admin portal works anywhere.  |
| No Approve / Reject buttons          | Editors cannot approve. Contact Super Admin to check your role.      |
| No Publish button                    | Publish is Super Admin only.                                         |
| No IP Allow List or Users tabs       | Super Admin only. Expected behavior.                                 |
| Changes not on live site             | Must be published, not just approved. Hard refresh: Ctrl+Shift+R     |
| Nextiva sync has unmatched records   | Check Pending Changes tab. Super Admin can add manual email mapping.  |

---

## Office IP Addresses

| Location        | IPs                                  |
|-----------------|--------------------------------------|
| Athens          | 4.36.173.10, 66.76.57.122            |
| Tyler           | 12.156.3.90, 75.110.177.134          |
| Gun Barrel City | 209.245.234.34, 209.33.56.59         |
| Longview        | 12.164.166.172, 206.255.14.253       |

---

## Important URLs

| Purpose          | URL                                      |
|------------------|------------------------------------------|
| Public Directory | https://staff.heatoneye.com              |
| Admin Portal     | https://staff.heatoneye.com/admin        |
| Login Page       | https://staff.heatoneye.com/admin/login  |

---

## Security Reminders

- Log out when finished, especially on shared devices
- Do not share your credentials with anyone
- Sessions expire after 7 days
- Double-check all data before submitting

---

## Support

**Email:** tickets@heatoneye.com
