/**
 * Piedmont Springs API Constants
 *
 * These are reverse-engineered from the Booker/Mindbody booking system.
 */

export const LOCATION_ID = 49414;
export const LOCATION_SLUG = 'PiedmontSprings';
export const BASE_API_URL = 'https://api.booker.com';
export const BOOKING_URL = `https://go.booker.com/location/${LOCATION_SLUG}`;

// API Management subscription key published in the go.booker.com SPA config.
export const SUBSCRIPTION_KEY = 'b8c686e771ac4e4a8173d8177e4e1c8c';

// Anonymous customer token endpoint used by the booking SPA.
// POST an empty JSON body with the subscription key. The issued JWT is scoped
// to Booker's public guest client (client_id claim "jc6lsrW3R5ID") and
// expires_in is 14400 seconds.
export const BOOKER_TOKEN_URL = `${BASE_API_URL}/cf2/v5/auth/connect/token`;

export const BOOKER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Target service keywords for filtering
export const TARGET_SERVICE_KEYWORDS = ['sauna', 'steam', 'hot tub', 'combination'];

// Service display configuration with priority ordering
export const SERVICE_CONFIG: Array<{ name: string; icon: string }> = [
  // Priority 1: One hour sessions
  { name: 'One Hour Combination Room', icon: '✨' },
  { name: 'One Hour Hot Tub', icon: '🛁' },
  // Priority 2: 45 minute sessions
  { name: '45 Minute Sauna', icon: '🔥' },
  { name: '45 Minute Steam', icon: '💨' },
  // Priority 3: 30 minute sessions (least priority)
  { name: '30 Minute Sauna', icon: '🔥' },
  { name: '30 Minute Steam', icon: '💨' },
];

// Section groupings by index in SERVICE_CONFIG
export const SECTION_TITLES: Record<number, string> = {
  0: 'One Hour Sessions',
  2: '45 Minute Sessions',
  4: '30 Minute Sessions',
};

// Default date range
export const DEFAULT_DAYS = 30;

// Refresh a cached guest token this long before its expires_in deadline.
export const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

// How long to keep an optional BOOKER_TOKEN fallback before trying the
// guest-token endpoint again.
export const TOKEN_ENV_FALLBACK_MS = 5 * 60 * 1000;
