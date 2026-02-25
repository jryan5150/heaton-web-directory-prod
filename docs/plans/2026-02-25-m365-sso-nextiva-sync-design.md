# M365 SSO + Nextiva CSV Sync + IP Restriction Design

**Date:** 2026-02-25
**Status:** Approved

## Overview

Three features for the Heaton Eye staff directory at staff.heatoneye.com:

1. Replace email/password admin login with Microsoft 365 SSO
2. Automated Nextiva phone system CSV sync with identity reconciliation
3. IP-restricted directory access (office networks only)

## 1. Microsoft 365 SSO

- OIDC/OAuth2 via Entra ID
- Only `@heatoneye.com` accounts
- Role mapping stays in app database (superadmin/approver/editor)
- Future-ready for Entra ID data sync (not implemented now)

## 2. Nextiva CSV Sync

### Matching Algorithm (Multi-Tier)
- **Tier 1:** Email match (case-insensitive) — 86% hit rate
- **Tier 2:** Name fuzzy match (normalized FirstName LastName) — catches email mismatches
- **Tier 3:** Manual mapping table in admin portal — for shared desk accounts

### Sync Behavior
- Confident matches: auto-update extension, phone, team, location
- Uncertain/new records: queued as pending changes for admin review
- Non-person filtering: skip entries matching device/room patterns (ASC, Call Park, Break Room, etc.)

### Ingestion Methods
- **Manual:** Admin portal drag/drop CSV upload with preview
- **Automated:** GitHub Actions cron runs Playwright scraper daily → POSTs CSV to upload API

## 3. IP Restriction

- Public directory restricted to 8 static office IPs via Next.js middleware
- Admin portal exempt (protected by M365 SSO)
- IP list managed in database via admin portal (superadmin only)

### Office IPs
| Location | IPs |
|----------|-----|
| Athens | 4.36.173.10, 66.76.57.122 |
| Tyler | 12.156.3.90, 75.110.177.134 |
| Gun Barrel City | 209.245.234.34, 209.33.56.59 |
| Longview | 12.164.166.172, 206.255.14.253 |

## Implementation Order

1. Database schema updates (AllowedIP, SyncMapping, SyncLog tables)
2. IP restriction middleware
3. M365 SSO (Entra ID OIDC)
4. Nextiva sync engine + manual upload API
5. Admin portal UI updates (Sync tab, IP management, SSO)
6. GitHub Actions Playwright scraper
7. User documentation
