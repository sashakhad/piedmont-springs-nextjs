# Booker guest tokens

The app fetches its own anonymous Booker access token. It does not need a pasted `BOOKER_TOKEN`, a browser, or a redeploy when the previous token expires.

## How the token is obtained

`go.booker.com` is an Ember app. On load it requests an anonymous customer token:

```
POST https://api.booker.com/cf2/v5/auth/connect/token
Ocp-Apim-Subscription-Key: <public key from the SPA config>
Content-Type: application/json

{}
```

The response is a bearer token with `expires_in` of 14400 seconds (4 hours). The JWT `client_id` is Booker's public guest client (`jc6lsrW3R5ID`). No client secret is sent. The subscription key is the same public APIM key already in `src/lib/piedmont/constants.ts`.

`src/lib/piedmont/token-service.ts` repeats that request from the server:

- The token is cached in memory until shortly before `expires_in`.
- A refresh starts before expiry, so callers do not use a token in its last minute.
- If Booker returns 401, the API client drops the cached token, fetches a new one, and retries that request once.
- `BOOKER_TOKEN` is optional. It is used only when the guest-token endpoint cannot be reached. A value that Booker has already rejected is not reused.

## Local debugging

```bash
pnpm tsx scripts/get-token.ts
```

That prints a fresh guest token. The app does not need it copied into Vercel.
