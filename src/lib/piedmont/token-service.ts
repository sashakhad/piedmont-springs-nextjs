/**
 * Token Service
 *
 * Obtains anonymous Booker customer tokens the same way go.booker.com does:
 * POST {} to /cf2/v5/auth/connect/token with the public APIM subscription key.
 * Tokens are cached in memory and refreshed before they expire.
 *
 * BOOKER_TOKEN is optional. It is not used while the guest-token endpoint
 * succeeds, so an expired value left in the environment cannot block availability.
 * If that endpoint is unreachable, BOOKER_TOKEN is a fallback. A token that
 * Booker has rejected is never reused.
 */

import {
  BOOKER_TOKEN_URL,
  BOOKER_USER_AGENT,
  BOOKING_URL,
  SUBSCRIPTION_KEY,
  TOKEN_ENV_FALLBACK_MS,
  TOKEN_REFRESH_BUFFER_MS,
} from './constants';

interface GuestToken {
  accessToken: string;
  expiresInSeconds: number;
}

interface CachedAccessToken {
  token: string;
  issuedAtMs: number;
  expiresAtMs: number;
}

interface GuestTokenPayload {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: CachedAccessToken | null = null;
let pendingRequest: Promise<string> | null = null;
let requestGeneration = 0;

/**
 * Get a valid access token, using the in-memory cache when it is still fresh.
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && isCachedTokenUsable(cachedToken)) {
    return cachedToken.token;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  const generation = requestGeneration;
  const request = loadAccessToken(generation, null);
  pendingRequest = request;
  return finishRequest(request, generation);
}

/**
 * Drop the cached token and fetch a new guest token.
 * Pass the token Booker just rejected so it is not used as a fallback.
 */
export async function refreshAccessToken(rejectedToken?: string): Promise<string> {
  cachedToken = null;
  requestGeneration += 1;
  const generation = requestGeneration;
  const request = loadAccessToken(generation, rejectedToken ?? null);
  pendingRequest = request;
  return finishRequest(request, generation);
}

/**
 * Clear the cached token (useful for testing or a forced refresh).
 */
export function clearTokenCache(): void {
  cachedToken = null;
  pendingRequest = null;
  requestGeneration += 1;
}

async function finishRequest(request: Promise<string>, generation: number): Promise<string> {
  try {
    return await request;
  } finally {
    if (pendingRequest === request && generation === requestGeneration) {
      pendingRequest = null;
    }
  }
}

async function loadAccessToken(generation: number, rejectedToken: string | null): Promise<string> {
  try {
    const guest = await requestGuestToken();
    rememberToken(guest.accessToken, Date.now(), guest.expiresInSeconds * 1000, generation);
    return guest.accessToken;
  } catch (error) {
    const fallback = readBookerTokenFallback();
    if (fallback && fallback !== rejectedToken) {
      console.warn('Booker guest token request failed; using BOOKER_TOKEN fallback');
      rememberToken(fallback, Date.now(), TOKEN_ENV_FALLBACK_MS, generation);
      return fallback;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to obtain a Booker access token');
  }
}

async function requestGuestToken(): Promise<GuestToken> {
  const response = await fetch(BOOKER_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      Origin: 'https://go.booker.com',
      Referer: BOOKING_URL,
      'User-Agent': BOOKER_USER_AGENT,
    },
    body: '{}',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Booker guest token request failed: ${response.status} ${response.statusText}`);
  }

  const payload: unknown = await response.json();
  const parsed = readGuestTokenPayload(payload);
  if (!parsed) {
    throw new Error('Booker guest token response was missing access_token or expires_in');
  }

  return {
    accessToken: parsed.access_token,
    expiresInSeconds: parsed.expires_in,
  };
}

function readGuestTokenPayload(value: unknown): GuestTokenPayload | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  if (!('access_token' in value) || !('expires_in' in value) || !('token_type' in value)) {
    return null;
  }

  const accessToken = value.access_token;
  const expiresIn = value.expires_in;
  const tokenType = value.token_type;

  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return null;
  }

  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return null;
  }

  if (typeof tokenType !== 'string' || tokenType.length === 0) {
    return null;
  }

  return {
    access_token: accessToken,
    expires_in: expiresIn,
    token_type: tokenType,
  };
}

function readBookerTokenFallback(): string | null {
  const value = process.env['BOOKER_TOKEN'];
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function rememberToken(
  token: string,
  issuedAtMs: number,
  lifetimeMs: number,
  generation: number
): void {
  if (generation !== requestGeneration) {
    return;
  }

  cachedToken = {
    token,
    issuedAtMs,
    expiresAtMs: issuedAtMs + lifetimeMs,
  };
}

function isCachedTokenUsable(entry: CachedAccessToken): boolean {
  const lifetimeMs = entry.expiresAtMs - entry.issuedAtMs;
  const bufferMs = lifetimeMs > TOKEN_REFRESH_BUFFER_MS ? TOKEN_REFRESH_BUFFER_MS : 0;
  return Date.now() + bufferMs < entry.expiresAtMs;
}
