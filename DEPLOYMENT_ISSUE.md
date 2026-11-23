# Deployment Issue: Token Service Architecture

## Status

| Environment | Status | Notes                                                           |
| ----------- | ------ | --------------------------------------------------------------- |
| **Local**   | Works  | Guest token is fetched with `POST /cf2/v5/auth/connect/token`   |
| **Vercel**  | Works  | Same server-side fetch. No browser and no pasted token required |

The previous failure mode was an expired `BOOKER_TOKEN` environment variable. Availability now requests a fresh anonymous Booker token on the server, caches it until shortly before expiry, and retries once after a 401. `BOOKER_TOKEN` remains an optional fallback when that token endpoint cannot be reached.

See `docs/TOKEN-REFRESH.md`.
