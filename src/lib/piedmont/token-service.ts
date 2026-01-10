/**
 * Token Service
 *
 * Obtains OAuth2 access tokens by intercepting API calls from the Booker web application.
 * Uses Playwright to load the booking site and capture the token from network requests.
 */

import { BOOKING_URL, TOKEN_CACHE_MS } from './constants';

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get a valid access token, using cache if available.
 */
export async function getAccessToken(): Promise<string> {
  // Check cache first
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // Obtain fresh token
  const token = await obtainTokenViaPlaywright();
  if (!token) {
    throw new Error('Failed to obtain access token from booking site');
  }

  // Cache the token
  cachedToken = token;
  tokenExpiry = Date.now() + TOKEN_CACHE_MS;

  return token;
}

/**
 * Use Playwright to capture a fresh access token from the booking site.
 */
async function obtainTokenViaPlaywright(): Promise<string | null> {
  // Dynamic import to avoid issues in environments without Playwright
  const { chromium } = await import('playwright');

  let accessToken: string | null = null;

  console.log('Obtaining access token from booking site...');

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Intercept network requests to capture the token
    page.on('request', (request) => {
      const url = request.url();
      // Look for access_token in query params of Booker API calls
      if (url.includes('access_token=') && url.includes('api.booker.com')) {
        const match = url.match(/access_token=([^&]+)/);
        if (match && !accessToken) {
          accessToken = match[1];
          console.log('✓ Token captured');
        }
      }
    });

    try {
      // Navigate with shorter timeout, don't wait for networkidle
      await page.goto(BOOKING_URL, { timeout: 15000, waitUntil: 'domcontentloaded' });

      // Wait a bit for API calls to fire
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(500);
        if (accessToken) {
          break;
        }
      }
    } catch (error) {
      console.log('Navigation warning:', error);
    }
  } finally {
    await browser.close();
  }

  return accessToken;
}

/**
 * Clear the cached token (useful for testing or forced refresh).
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = null;
}
