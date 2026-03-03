// @ts-nocheck — standalone script, not part of the Next.js build
/**
 * Nextiva CSV Scraper
 *
 * Automates exporting the Users CSV from the Nextiva admin portal and
 * POSTing it to the Heaton directory sync endpoint.
 *
 * Usage:
 *   NEXTIVA_USERNAME=... NEXTIVA_PASSWORD=... SYNC_UPLOAD_URL=... SYNC_SECRET=... npx tsx scripts/nextiva-scraper.ts
 *
 * Required env vars:
 *   NEXTIVA_USERNAME  - Nextiva admin email
 *   NEXTIVA_PASSWORD  - Nextiva admin password
 *   SYNC_UPLOAD_URL   - Full URL to the sync upload endpoint
 *   SYNC_SECRET       - Bearer token for authentication
 */

import { chromium, type Page, type Browser } from 'playwright'
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REQUIRED_ENV_VARS = [
  'NEXTIVA_USERNAME',
  'NEXTIVA_PASSWORD',
  'SYNC_UPLOAD_URL',
  'SYNC_SECRET',
] as const

const LOGIN_URL = 'https://authenticate.nextiva.com/AccountValidation/login.action'
const LOGIN_TIMEOUT_MS = 60_000
const NAVIGATION_TIMEOUT_MS = 30_000
const DOWNLOAD_TIMEOUT_MS = 60_000
const MAX_LOGIN_ATTEMPTS = 3
const SCREENSHOT_DIR = join(process.cwd(), 'screenshots')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(message: string): void {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}

function logError(message: string): void {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] ERROR: ${message}`)
}

function validateEnv(): Record<(typeof REQUIRED_ENV_VARS)[number], string> {
  const missing: string[] = []
  const env: Record<string, string> = {}

  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key]
    if (!value || value.trim().length === 0) {
      missing.push(key)
    } else {
      env[key] = value.trim()
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }

  return env as Record<(typeof REQUIRED_ENV_VARS)[number], string>
}

function ensureScreenshotDir(): void {
  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
}

async function takeScreenshot(
  page: Page,
  name: string
): Promise<string | null> {
  try {
    ensureScreenshotDir()
    const filepath = join(SCREENSHOT_DIR, `${name}.png`)
    await page.screenshot({ path: filepath, fullPage: true })
    log(`Screenshot saved: ${filepath}`)
    return filepath
  } catch (err) {
    logError(`Failed to take screenshot "${name}": ${err}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

async function login(
  page: Page,
  username: string,
  password: string
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
    log(`Login attempt ${attempt}/${MAX_LOGIN_ATTEMPTS}...`)

    try {
      await page.goto(LOGIN_URL, {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT_MS,
      })

      log('Login page loaded, filling credentials...')
      await takeScreenshot(page, `login-page-attempt-${attempt}`)

      // Nextiva login page uses a plain text input with placeholder
      // "Username or Email" — NOT type="email". It's a two-step flow:
      // Step 1: Enter username/email → click "Next"
      // Step 2: Enter password → click "Sign in"
      const usernameInput = await page
        .waitForSelector(
          [
            'input[placeholder*="Username"]',
            'input[placeholder*="Email"]',
            'input[type="text"]',
            'input[type="email"]',
            'input[name="username"]',
            'input[name="email"]',
            'input#username',
            'input#email',
          ].join(', '),
          { timeout: LOGIN_TIMEOUT_MS }
        )

      if (!usernameInput) {
        throw new Error('Could not find username/email input field')
      }

      await usernameInput.fill(username)
      log('Username entered')

      // Nextiva uses a two-step login: click "Next" to get to password
      const nextButton = await page.$(
        'button:has-text("Next"), button[type="submit"], button:has-text("Continue")'
      )
      if (nextButton) {
        log('Clicking Next to proceed to password step...')
        await nextButton.click()
        // Wait for the password field to appear
        await page.waitForSelector('input[type="password"]', {
          timeout: LOGIN_TIMEOUT_MS,
        })
        log('Password field appeared')
      }

      // Fill password
      const passwordInput = await page.waitForSelector(
        'input[type="password"]',
        { timeout: LOGIN_TIMEOUT_MS }
      )

      if (!passwordInput) {
        throw new Error('Could not find password input field')
      }

      await passwordInput.fill(password)
      log('Password entered')

      // Submit — look for "Sign in", "Sign In", "Log In", or submit button
      const submitButton = await page.$(
        'button:has-text("Sign in"), button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login"), button[type="submit"]'
      )

      if (submitButton) {
        await submitButton.click()
        log('Login form submitted')
      } else {
        // Fallback: press Enter
        await passwordInput.press('Enter')
        log('Login form submitted via Enter key')
      }

      // Wait for navigation away from the login page — after successful auth,
      // Nextiva redirects from authenticate.nextiva.com to np3.nextiva.com
      await page.waitForURL(
        (url) =>
          !url.href.includes('authenticate.nextiva.com') &&
          !url.href.includes('login'),
        { timeout: LOGIN_TIMEOUT_MS }
      )

      const postLoginUrl = page.url()
      log(`Login successful — redirected to: ${postLoginUrl}`)

      // Extract the tenant base URL (e.g. https://heatoneye.nextos.com)
      const urlObj = new URL(postLoginUrl)
      const tenantBaseUrl = `${urlObj.protocol}//${urlObj.host}`
      log(`Tenant base URL: ${tenantBaseUrl}`)

      return tenantBaseUrl
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      logError(
        `Login attempt ${attempt} failed: ${lastError.message}`
      )
      await takeScreenshot(page, `login-failure-attempt-${attempt}`)

      if (attempt < MAX_LOGIN_ATTEMPTS) {
        const delayMs = attempt * 5_000
        log(`Waiting ${delayMs / 1000}s before retry...`)
        await page.waitForTimeout(delayMs)
      }
    }
  }

  throw new Error(
    `Login failed after ${MAX_LOGIN_ATTEMPTS} attempts. Last error: ${lastError?.message}`
  )
}

// ---------------------------------------------------------------------------
// Navigate to Users page and export CSV
// ---------------------------------------------------------------------------

async function navigateToUsersPage(
  page: Page,
  tenantBaseUrl: string
): Promise<void> {
  log('Navigating to Users management page...')

  // First, make sure the dashboard SPA has finished loading.
  // The post-login page at {tenant}.nextos.com/apps/home/#/ is a SPA
  // that may still be rendering when we get here.
  log('Waiting for dashboard SPA to finish loading...')
  await page.waitForLoadState('networkidle', { timeout: NAVIGATION_TIMEOUT_MS })
  // Give the SPA extra time to render after network settles
  await page.waitForTimeout(3_000)
  await takeScreenshot(page, 'dashboard-loaded')

  // NextOS uses hash-based routing. The Users page is typically at
  // {tenant}.nextos.com/apps/home/#/users or accessible via the admin
  // section. Try hash navigation first since it's the SPA pattern.
  const hashPaths = ['#/users', '#/admin/users', '#/management/users']

  for (const hash of hashPaths) {
    try {
      const usersUrl = `${tenantBaseUrl}/apps/home/${hash}`
      log(`Trying hash navigation: ${usersUrl}`)
      await page.goto(usersUrl, {
        waitUntil: 'networkidle',
        timeout: NAVIGATION_TIMEOUT_MS,
      })
      await page.waitForTimeout(2_000)

      // Check if we landed on a page with user-related content
      const hasUsersContent = await page
        .waitForSelector(
          'text=Users, text=User Management, table, [class*="user"]',
          { timeout: 10_000 }
        )
        .catch(() => null)

      if (hasUsersContent) {
        log(`Users page loaded via hash route: ${hash}`)
        await takeScreenshot(page, 'users-page-loaded')
        return
      }
    } catch {
      // Try next hash path
    }
  }

  // Fallback: go back to the dashboard and look for a "Users" link/button
  log('Hash navigation failed, trying to find Users in the dashboard UI...')
  await page.goto(`${tenantBaseUrl}/apps/home/#/`, {
    waitUntil: 'networkidle',
    timeout: NAVIGATION_TIMEOUT_MS,
  })
  await page.waitForTimeout(3_000)
  await takeScreenshot(page, 'dashboard-for-nav')

  const menuSelectors = [
    'a:has-text("Users")',
    'button:has-text("Users")',
    '[data-testid="users"]',
    '[data-testid="users-nav"]',
    'nav >> text=Users',
    'a[href*="users"]',
    'a[href*="Users"]',
    'span:has-text("Users")',
    // NextOS dashboard cards — may be clickable tiles
    'div:has-text("Users") >> visible=true',
  ]

  for (const selector of menuSelectors) {
    try {
      const menuItem = await page.waitForSelector(selector, {
        timeout: 5_000,
      })
      if (menuItem) {
        await menuItem.click()
        await page.waitForLoadState('networkidle', {
          timeout: NAVIGATION_TIMEOUT_MS,
        })
        await page.waitForTimeout(2_000)
        log(`Users page loaded via menu click: ${selector}`)
        log(`Current URL: ${page.url()}`)
        await takeScreenshot(page, 'users-page-via-menu')
        return
      }
    } catch {
      // Try next selector
    }
  }

  await takeScreenshot(page, 'users-page-navigation-failure')
  throw new Error(
    'Could not navigate to Users page — none of the expected hash routes or menu selectors worked'
  )
}

async function exportUsersCSV(page: Page): Promise<string> {
  log('Looking for CSV export button...')

  // Nextiva's Users page has a "Download CSV" button at the top right
  const exportSelectors = [
    'button:has-text("Download CSV")',
    'a:has-text("Download CSV")',
    'button:has-text("Export CSV")',
    'button:has-text("Export")',
    'button:has-text("Download")',
    'a:has-text("Export")',
    'a:has-text("Download")',
    '[data-testid="export"]',
    '[data-testid="export-csv"]',
    '[data-testid="download-csv"]',
    '[aria-label="Export"]',
    '[aria-label="Download"]',
    '[aria-label="Download CSV"]',
    'button >> svg', // Icon-only export buttons
  ]

  let exportButton = null

  for (const selector of exportSelectors) {
    try {
      exportButton = await page.waitForSelector(selector, {
        timeout: 5_000,
      })
      if (exportButton) {
        log(`Found export button with selector: ${selector}`)
        break
      }
    } catch {
      // Try next selector
    }
  }

  if (!exportButton) {
    await takeScreenshot(page, 'export-button-not-found')
    throw new Error(
      'Could not find CSV export/download button on the Users page'
    )
  }

  // Set up download listener before clicking
  log('Initiating CSV download...')
  const downloadPromise = page.waitForEvent('download', {
    timeout: DOWNLOAD_TIMEOUT_MS,
  })

  await exportButton.click()

  // Some portals show a dropdown with format options — look for CSV option
  const csvOption = await page
    .$('text=CSV, text=.csv, [data-value="csv"]')
    .catch(() => null)

  if (csvOption) {
    log('Selecting CSV format from dropdown...')
    await csvOption.click()
  }

  const download = await downloadPromise
  log(`Download started: ${download.suggestedFilename()}`)

  // Save the downloaded file
  const downloadPath = join(SCREENSHOT_DIR, download.suggestedFilename() || 'nextiva-users.csv')
  ensureScreenshotDir()
  await download.saveAs(downloadPath)

  log(`CSV saved to: ${downloadPath}`)

  // Read the file contents
  const csvContent = readFileSync(downloadPath, 'utf-8')

  if (!csvContent || csvContent.trim().length === 0) {
    throw new Error('Downloaded CSV file is empty')
  }

  const lineCount = csvContent.split('\n').filter((line) => line.trim()).length
  log(`CSV contains ${lineCount} lines (including header)`)

  return csvContent
}

// ---------------------------------------------------------------------------
// Upload CSV to sync endpoint
// ---------------------------------------------------------------------------

async function uploadCSV(
  csvContent: string,
  uploadUrl: string,
  syncSecret: string
): Promise<void> {
  log(`Uploading CSV to ${uploadUrl}...`)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${syncSecret}`,
      'Content-Type': 'text/csv',
    },
    body: csvContent,
  })

  const responseText = await response.text()

  if (!response.ok) {
    logError(`Sync endpoint returned ${response.status}: ${responseText}`)
    throw new Error(
      `Sync upload failed with status ${response.status}: ${responseText}`
    )
  }

  // Try to parse as JSON for structured logging
  try {
    const result = JSON.parse(responseText)
    log(`Sync result: ${JSON.stringify(result, null, 2)}`)
  } catch {
    log(`Sync response: ${responseText}`)
  }

  log('CSV uploaded successfully')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log('=== Nextiva CSV Sync — Starting ===')

  // Validate environment
  const env = validateEnv()
  log('Environment variables validated')

  let browser: Browser | null = null

  try {
    // Launch browser
    log('Launching Chromium (headless)...')
    browser = await chromium.launch({
      headless: true,
    })

    const context = await browser.newContext({
      acceptDownloads: true,
      viewport: { width: 1280, height: 720 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })

    const page = await context.newPage()

    // Set default timeouts
    page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS)
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS)

    // Step 1: Login — returns the tenant-specific base URL
    // (e.g. https://heatoneye.nextos.com)
    const tenantBaseUrl = await login(page, env.NEXTIVA_USERNAME, env.NEXTIVA_PASSWORD)

    // Screenshot the dashboard for debugging
    await takeScreenshot(page, 'post-login-dashboard')
    log(`Current URL after login: ${page.url()}`)

    // Step 2: Navigate to Users page
    await navigateToUsersPage(page, tenantBaseUrl)

    // Step 3: Export CSV
    const csvContent = await exportUsersCSV(page)

    // Step 4: Upload CSV to sync endpoint
    await uploadCSV(csvContent, env.SYNC_UPLOAD_URL, env.SYNC_SECRET)

    // Cleanup
    await context.close()
    log('=== Nextiva CSV Sync — Complete ===')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    logError(`Fatal: ${errorMessage}`)

    if (err instanceof Error && err.stack) {
      logError(`Stack: ${err.stack}`)
    }

    process.exit(1)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

main()
