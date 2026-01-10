/**
 * Client-safe Piedmont Springs utilities
 * 
 * These functions are safe to import in client components (no server-only dependencies).
 */

import { LOCATION_SLUG } from './constants';

/**
 * Build booking URL for a specific service and date.
 */
export function buildBookingUrl(serviceId: number, serviceName: string, date: string): string {
  const encodedName = encodeURIComponent(serviceName);
  return `https://go.booker.com/location/${LOCATION_SLUG}/service/${serviceId}/${encodedName}/availability/${date}/any-provider`;
}
