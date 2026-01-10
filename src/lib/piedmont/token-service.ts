/**
 * Token Service
 *
 * Obtains OAuth2 access tokens for the Booker API.
 *
 * In production (Vercel): Uses BOOKER_TOKEN environment variable
 * In development: Falls back to Playwright scraping if no env token
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

  // Try environment variable first (for production/Vercel)
  const envToken = process.env.BOOKER_TOKEN;
  if (envToken) {
    console.log('Using BOOKER_TOKEN from environment');
    cachedToken = envToken;
    // Env tokens are refreshed externally, cache for 1 hour locally
    tokenExpiry = Date.now() + 60 * 60 * 1000;
    return envToken;
  }

  // Fall back to Playwright scraping (development only)
  const token = await obtainTokenViaPlaywright();
  if (!token) {
    throw new Error(
      'Failed to obtain access token. Set BOOKER_TOKEN env var or ensure Playwright is available.'
    );
  }

  // Cache the token
  cachedToken = token;
  tokenExpiry = Date.now() + TOKEN_CACHE_MS;

  return token;
}

/**
 * Use Playwright to capture a fresh access token from the booking site.
 * Only works in environments with Playwright available (local dev).
 */
async function obtainTokenViaPlaywright(): Promise<string | null> {
  let chromium;
  try {
    // Dynamic import - will fail in serverless
    const playwright = await import('playwright');
    chromium = playwright.chromium;
  } catch {
    console.error('Playwright not available. Set BOOKER_TOKEN environment variable.');
    return null;
  }

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
        const token = match?.[1];
        if (token && !accessToken) {
          accessToken = token;
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
