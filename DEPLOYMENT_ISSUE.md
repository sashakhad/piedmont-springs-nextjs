# Deployment Issue: Token Service Architecture

## Status

| Environment | Status | Notes |
|-------------|--------|-------|
| **Local** | ✅ Works | API returns real availability, token captured via Playwright |
| **Vercel** | ❌ Fails | Playwright can't run - no browser in serverless |

---

## The Problem

Your app talks to the Booker/Mindbody API (`api.booker.com`) which requires an OAuth2 access token. There's no documented public API to get this token - it's meant for their own frontend.

**The current solution:** Use Playwright to load the booking site (`go.booker.com/location/PiedmontSprings`), intercept the network requests, and steal the `access_token` from the URL query params when the page makes API calls.

**Why it fails on Vercel:** Playwright needs to launch a real Chromium browser. Vercel serverless functions don't have browsers - they're lightweight containers with no GUI dependencies.

---

## What You Have

| Component | What it does |
|-----------|--------------|
| `token-service.ts` | Launches Playwright, loads booking site, intercepts token from network requests |
| `api-client.ts` | Makes authenticated requests to `api.booker.com` using the token |
| `constants.ts` | Has `SUBSCRIPTION_KEY` (API management key) already reverse-engineered |
| `/api/availability` route | Server-side endpoint that calls the API client |

The token lasts ~4 hours and is cached in memory (which also doesn't persist across serverless invocations).

---

## Prompt for Exploring Alternatives

```
I have a Next.js app deployed on Vercel that needs to call the Booker/Mindbody API (api.booker.com). The API requires an OAuth2 access token that I currently obtain by using Playwright to scrape the booking website and intercept the token from network requests. This doesn't work on Vercel because serverless functions can't run browsers.

Known facts about the API:
- Base URL: https://api.booker.com
- Requires header: Ocp-Apim-Subscription-Key: b8c686e771ac4e4a8173d8177e4e1c8c
- Requires: Authorization: Bearer {token} AND access_token={token} in query params
- Token is obtained by the Booker frontend JS when loading go.booker.com
- Token lasts approximately 4 hours

I need to explore alternatives:

1. **Is there a public OAuth flow or API key method** for Booker/Mindbody that doesn't require browser scraping?

2. **Can I use a headless browser service** (Browserless.io, Playwright cloud, BrowserBase) from a serverless function?

3. **Can I pre-fetch the token externally** and inject it as an environment variable, refreshing it via GitHub Actions or a cron job?

4. **Should I deploy to a different platform** that supports browser automation (Railway, Render, Fly.io with Docker)?

5. **Is there a client-side approach** where the user's browser fetches the token directly from the booking widget?

What's the simplest path to production that maintains the current functionality?
```

---

## Quick Reference

- **GitHub**: https://github.com/sashakhad/piedmont-springs-nextjs
- **Vercel**: https://piedmont-springs-nextjs.vercel.app (deployed but API fails)
- **Local**: `pnpm dev` → http://localhost:3001
