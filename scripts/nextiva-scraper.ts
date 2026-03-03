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

  // The Users page is at {tenant}.nextos.com/apps/platform-admin/#/users
  // (discovered via screenshot analysis of actual navigation).
  // Try direct URL first, then fall back to sidebar click.

  const usersUrl = `${tenantBaseUrl}/apps/platform-admin/#/users`
  log(`Navigating directly to: ${usersUrl}`)

  try {
    await page.goto(usersUrl, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT_MS,
    })
    // Wait for the "Current Users" heading to confirm we're on the right page
    await page.waitForSelector('text=Current Users', { timeout: 15_000 })
    log('Users page loaded via direct URL')
    await takeScreenshot(page, 'users-page-loaded')
    return
  } catch {
    log('Direct URL failed, falling back to sidebar navigation...')
  }

  // Fallback: wait for dashboard to load, then click "Users" in sidebar
  log('Waiting for dashboard SPA to load...')
  await page.goto(`${tenantBaseUrl}/apps/home/#/`, {
    waitUntil: 'networkidle',
    timeout: NAVIGATION_TIMEOUT_MS,
  })
  // Wait for sidebar to render
  await page.waitForSelector('text=Admin Home', { timeout: 15_000 })
  await page.waitForTimeout(2_000)
  await takeScreenshot(page, 'dashboard-loaded')

  // Click "Users" in the sidebar (under "PEOPLE" section)
  const menuSelectors = [
    'a:has-text("Users")',
    'button:has-text("Users")',
    'nav >> text=Users',
    'a[href*="users"]',
    'span:has-text("Users")',
  ]

  for (const selector of menuSelectors) {
    try {
      const menuItem = await page.waitForSelector(selector, {
        timeout: 5_000,
      })
      if (menuItem) {
        await menuItem.click()
        await page.waitForSelector('text=Current Users', { timeout: 15_000 })
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
  log('Looking for CSV export/download button...')

  // The Nextiva Users page has a download icon (SVG arrow-down) near
  // the "Current Users" heading, to the left of the search bar.
  // It's an icon-only button — no text label.
  const exportSelectors = [
    // Aria labels (most reliable for icon buttons)
    '[aria-label*="download" i]',
    '[aria-label*="export" i]',
    '[aria-label*="csv" i]',
    // Tooltip/title attributes
    '[title*="download" i]',
    '[title*="export" i]',
    '[title*="csv" i]',
    // Data test IDs
    '[data-testid*="download"]',
    '[data-testid*="export"]',
    // Text-based buttons
    'button:has-text("Download CSV")',
    'button:has-text("Export CSV")',
    'button:has-text("Export")',
    'button:has-text("Download")',
    'a:has-text("Download CSV")',
  ]

  let exportButton = null

  for (const selector of exportSelectors) {
    try {
      exportButton = await page.waitForSelector(selector, {
        timeout: 3_000,
      })
      if (exportButton) {
        log(`Found export button with selector: ${selector}`)
        break
      }
    } catch {
      // Try next selector
    }
  }

  // Last resort: find the download icon SVG button near "Current Users"
  if (!exportButton) {
    log('Trying to locate download icon button near Current Users heading...')
    try {
      // The download icon is typically the first icon button in the toolbar
      // area near the "Current Users" heading, before the search input
      const buttons = await page.$$('button:has(svg)')
      for (const btn of buttons) {
        const bbox = await btn.boundingBox()
        // The download button should be in the top area of the page
        // (above the user list), roughly in the header bar area
        if (bbox && bbox.y < 250 && bbox.y > 100) {
          log(`Found SVG button at position (${bbox.x}, ${bbox.y})`)
          exportButton = btn
          break
        }
      }
    } catch (err) {
      log(`SVG button search failed: ${err}`)
    }
  }

  if (!exportButton) {
    await takeScreenshot(page, 'export-button-not-found')
    throw new Error(
      'Could not find CSV export/download button on the Users page'
    )
  }

  await takeScreenshot(page, 'before-export-click')

  // Set up download listener BEFORE clicking — the download may fire
  // immediately or after a short delay
  log('Initiating CSV download...')
  const downloadPromise = page.waitForEvent('download', {
    timeout: DOWNLOAD_TIMEOUT_MS,
  })

  await exportButton.click()
  log('Export button clicked')

  // Take a screenshot to see what happened after clicking
  await page.waitForTimeout(2_000)
  await takeScreenshot(page, 'after-export-click')

  // Check if a modal/dropdown appeared that needs further interaction
  const csvOption = await page
    .$('text=CSV, text=.csv, [data-value="csv"], button:has-text("Download"), button:has-text("Export")')
    .catch(() => null)

  if (csvOption) {
    log('Found secondary option after click, selecting...')
    await csvOption.click()
  }

  let csvContent: string

  try {
    // Try to catch the standard browser download event
    const download = await downloadPromise
    log(`Download started: ${download.suggestedFilename()}`)

    const downloadPath = join(SCREENSHOT_DIR, download.suggestedFilename() || 'nextiva-users.csv')
    ensureScreenshotDir()
    await download.saveAs(downloadPath)
    log(`CSV saved to: ${downloadPath}`)

    csvContent = readFileSync(downloadPath, 'utf-8')
  } catch (downloadErr) {
    // If download event didn't fire, the SPA might have generated a
    // blob URL or opened a new tab. Check for blob/data URLs.
    log(`Standard download failed: ${downloadErr}. Checking for alternative download methods...`)
    await takeScreenshot(page, 'download-fallback')

    // Check if a new page/tab was opened with the CSV
    const pages = page.context().pages()
    if (pages.length > 1) {
      const newPage = pages[pages.length - 1]
      log(`Found new tab: ${newPage.url()}`)
      csvContent = await newPage.content()
      await newPage.close()
    } else {
      throw downloadErr
    }
  }

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
