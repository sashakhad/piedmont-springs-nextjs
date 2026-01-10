#!/usr/bin/env npx ts-node
/**
 * Token Fetcher Script
 *
 * Grabs a fresh Booker API token using Playwright.
 * Run this locally and copy the output to your Vercel environment variables.
 *
 * Usage:
 *   pnpm tsx scripts/get-token.ts
 *
 * Then set the output as BOOKER_TOKEN in Vercel:
 *   vercel env add BOOKER_TOKEN production
 */

import { chromium } from 'playwright';

const BOOKING_URL = 'https://go.booker.com/location/PiedmontSprings';

async function getToken(): Promise<string | null> {
  let accessToken: string | null = null;

  console.error('🔄 Launching browser...');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('access_token=') && url.includes('api.booker.com')) {
        const match = url.match(/access_token=([^&]+)/);
        const token = match?.[1];
        if (token && !accessToken) {
          accessToken = token;
          console.error('✓ Token captured');
        }
      }
    });

    console.error('🌐 Loading booking site...');
    await page.goto(BOOKING_URL, { timeout: 30000, waitUntil: 'domcontentloaded' });

    // Wait for token
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(500);
      if (accessToken) break;
    }
  } finally {
    await browser.close();
  }

  return accessToken;
}

async function main() {
  const token = await getToken();

  if (token) {
    // Output only the token to stdout (for piping)
    console.log(token);
    console.error('\n✅ Token obtained successfully!');
    console.error('Token length:', token.length);
    console.error('\nTo set in Vercel:');
    console.error('  vercel env add BOOKER_TOKEN production');
    console.error('  (paste the token when prompted)\n');
  } else {
    console.error('❌ Failed to obtain token');
    process.exit(1);
  }
}

main();
