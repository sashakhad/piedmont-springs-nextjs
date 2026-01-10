/**
 * Piedmont Springs API Constants
 *
 * These are reverse-engineered from the Booker/Mindbody booking system.
 */

export const LOCATION_ID = 49414;
export const LOCATION_SLUG = 'PiedmontSprings';
export const BASE_API_URL = 'https://api.booker.com';
export const BOOKING_URL = `https://go.booker.com/location/${LOCATION_SLUG}`;

// API Management subscription key (from app config)
export const SUBSCRIPTION_KEY = 'b8c686e771ac4e4a8173d8177e4e1c8c';

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

// Token cache duration (3 hours, conservative since tokens last ~4 hours)
export const TOKEN_CACHE_MS = 3 * 60 * 60 * 1000;
