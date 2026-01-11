# Booker Token Auto-Refresh System

## Overview

The Piedmont Springs app needs an OAuth access token to fetch availability data from Booker's API. These tokens expire every ~4 hours, so we have an automated system to refresh them.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions (Cron)                       │
│                     Runs every 3 hours                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Launches Playwright (headless browser)                      │
│  2. Visits go.booker.com/location/PiedmontSprings               │
│  3. Intercepts network requests to capture access_token         │
│  4. Updates BOOKER_TOKEN env var in Vercel via API              │
│  5. Triggers a production redeploy                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel                                  │
├─────────────────────────────────────────────────────────────────┤
│  • Stores BOOKER_TOKEN as encrypted environment variable        │
│  • API route uses token to call Booker API                      │
│  • Edge caches responses for 1 hour                             │
└─────────────────────────────────────────────────────────────────┘
```

## Why GitHub Actions Instead of Vercel?

**Vercel serverless functions cannot run Playwright** (no browser support). GitHub Actions provides a full Ubuntu environment where we can:
- Install Chromium
- Run Playwright to scrape the token
- Make API calls to update Vercel

## Components

### 1. GitHub Actions Workflow
**File:** `.github/workflows/refresh-token.yml`

**Schedule:** Every 3 hours (`0 */3 * * *`)

**Steps:**
1. Checkout code
2. Install Node.js + pnpm
3. Install Playwright + Chromium
4. Run `scripts/get-token.ts` to capture a fresh token
5. Delete old `BOOKER_TOKEN` from Vercel (via API)
6. Add new `BOOKER_TOKEN` to Vercel (via API)
7. Trigger production redeploy

### 2. Token Capture Script
**File:** `scripts/get-token.ts`

Uses Playwright to:
- Open the Booker booking page in a headless browser
- Listen for network requests containing `access_token=`
- Extract and output the token

### 3. GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (from your local Vercel CLI auth) |
| `VERCEL_PROJECT_ID` | `prj_Jf3KaYMsGzeakwF9rCdVT4qxAC6X` |

### 4. Vercel Environment Variable

| Variable | Target | Type |
|----------|--------|------|
| `BOOKER_TOKEN` | Production | Encrypted |

## Manual Operations

### Trigger a manual refresh
```bash
gh workflow run refresh-token.yml
```

### Watch the workflow run
```bash
gh run watch
```

### View recent runs
```bash
gh run list --workflow=refresh-token.yml
```

### Get a token locally (for debugging)
```bash
npx tsx scripts/get-token.ts
```

### Manually update Vercel token
```bash
# Get fresh token
TOKEN=$(npx tsx scripts/get-token.ts 2>/dev/null)

# Update in Vercel
vercel env rm BOOKER_TOKEN production --yes
echo "$TOKEN" | vercel env add BOOKER_TOKEN production

# Redeploy
vercel --prod --yes
```

## Troubleshooting

### App shows 500 error
The token has likely expired. Either:
- Wait for the next cron run (max 3 hours)
- Trigger manual refresh: `gh workflow run refresh-token.yml`

### Workflow fails at "Get fresh token"
Booker's site structure may have changed. Check if the booking page still loads at:
https://go.booker.com/location/PiedmontSprings

### Workflow fails at Vercel API steps
- Verify `VERCEL_TOKEN` secret is still valid
- Tokens can be regenerated at https://vercel.com/account/tokens

### Token expires faster than expected
The Booker token typically lasts ~4 hours. Our 3-hour refresh cycle should keep it fresh, but if issues persist, you can change the cron schedule in the workflow file:

```yaml
schedule:
  - cron: '0 */2 * * *'  # Every 2 hours instead
```

## Token Lifecycle

```
Hour 0:  GitHub Action runs, gets fresh token (valid ~4 hours)
Hour 1:  Token valid ✓
Hour 2:  Token valid ✓
Hour 3:  GitHub Action runs, gets NEW fresh token
Hour 4:  Old token would expire, but we already have a new one ✓
...repeat...
```

## Cost

- **GitHub Actions:** Free tier includes 2,000 minutes/month. This workflow uses ~1 min per run × 8 runs/day × 30 days = ~240 minutes/month. Well within free tier.
- **Vercel:** No additional cost. Uses existing deployment infrastructure.
