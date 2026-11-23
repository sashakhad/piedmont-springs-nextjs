#!/usr/bin/env npx tsx
/**
 * Prints a Booker guest access token using the same server-side request as the app.
 *
 * The running app fetches and refreshes this token itself. BOOKER_TOKEN is only
 * a fallback for when the guest-token endpoint cannot be reached.
 *
 * Usage:
 *   pnpm tsx scripts/get-token.ts
 */

import { clearTokenCache, getAccessToken } from '../src/lib/piedmont/token-service';

async function main(): Promise<void> {
  delete process.env['BOOKER_TOKEN'];
  clearTokenCache();
  const token = await getAccessToken();
  process.stdout.write(`${token}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Failed to obtain token';
  console.error(message);
  process.exit(1);
});
