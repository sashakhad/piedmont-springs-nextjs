/**
 * Piedmont Springs API Client
 *
 * Reverse-engineered API client for checking availability at Piedmont Springs spa.
 * Uses the Booker/Mindbody API (api.booker.com).
 */

import {
  BASE_API_URL,
  LOCATION_ID,
  LOCATION_SLUG,
  SUBSCRIPTION_KEY,
  TARGET_SERVICE_KEYWORDS,
} from './constants';
import { getAccessToken } from './token-service';
import type {
  AvailabilityByDate,
  AvailabilityByService,
  BookerAvailabilityLocation,
  BookerMenuSection,
  BookerTimeSlot,
  Service,
  TimeSlot,
} from './types';

/**
 * Make an authenticated API request to the Booker API.
 */
async function apiRequest<T>(
  method: 'GET' | 'POST',
  endpoint: string,
  params?: Record<string, string | number>,
  jsonData?: Record<string, unknown>
): Promise<T> {
  const token = await getAccessToken();

  // Build URL with query params
  const url = new URL(`${BASE_API_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  url.searchParams.set('access_token', token);

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: jsonData ? JSON.stringify(jsonData) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Parse duration string like '30 min' or '1 hr 10 min' to minutes.
 */
function parseDuration(durationStr: string): number {
  let totalMinutes = 0;

  const hrMatch = durationStr.match(/(\d+)\s*hr/);
  if (hrMatch) {
    totalMinutes += parseInt(hrMatch[1], 10) * 60;
  }

  const minMatch = durationStr.match(/(\d+)\s*min/);
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }

  return totalMinutes;
}

/**
 * Get all bookable services from the menu.
 */
export async function getAllServices(): Promise<Service[]> {
  const data = await apiRequest<{ Data: BookerMenuSection[] }>(
    'GET',
    `/cf2/v5/customer/locations/${LOCATION_SLUG}/menu/sections`,
    { include: 'menu-groups,menu-groups.menu-group-items,menu-group-items' }
  );

  const services: Service[] = [];

  for (const section of data.Data || []) {
    for (const menuGroup of section.MenuGroups || []) {
      const categoryName = menuGroup.Name || 'Unknown';

      for (const item of menuGroup.MenuGroupItems || []) {
        const serviceId = item.ServiceId;
        if (serviceId) {
          const durationStr = item.DisplayDuration || '0 min';
          const priceStr = item.DisplayPrice || '$0.00';
          const price = parseFloat(priceStr.replace('$', '').replace(',', ''));

          services.push({
            id: serviceId,
            name: (item.Name || 'Unknown').trim(),
            durationMinutes: parseDuration(durationStr),
            price,
            category: categoryName,
          });
        }
      }
    }
  }

  return services;
}

/**
 * Get only the target services (sauna, steam, hot tub, combination).
 */
export async function getTargetServices(): Promise<Service[]> {
  const allServices = await getAllServices();
  return allServices.filter((s) =>
    TARGET_SERVICE_KEYWORDS.some((kw) => s.name.toLowerCase().includes(kw))
  );
}

/**
 * Get dates with availability for a service.
 */
export async function getAvailableDates(
  serviceId: number,
  fromDate: Date,
  toDate: Date
): Promise<string[]> {
  const data = await apiRequest<BookerAvailabilityLocation[]>(
    'GET',
    '/cf2/v5/availability/availabledates',
    {
      serviceId,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
      'locationIds[]': LOCATION_ID,
      employeeId: '',
      employeeGenderId: '',
    }
  );

  const dates: string[] = [];

  if (Array.isArray(data)) {
    for (const location of data) {
      for (const category of location.serviceCategories || []) {
        for (const service of category.services || []) {
          if (service.serviceId === serviceId) {
            // Parse ISO dates to YYYY-MM-DD format
            for (const dateStr of service.availability as string[]) {
              const datePart = dateStr.split('T')[0];
              if (!dates.includes(datePart)) {
                dates.push(datePart);
              }
            }
          }
        }
      }
    }
  }

  return dates.sort();
}

/**
 * Get available time slots for a service on a specific date.
 */
export async function getTimeSlots(serviceId: number, date: Date): Promise<TimeSlot[]> {
  const dateStr = formatDate(date);
  const fromDt = `${dateStr}T00:00:00-08:00`;
  const toDt = `${dateStr}T23:59:00-08:00`;

  const data = await apiRequest<BookerAvailabilityLocation[]>(
    'GET',
    '/cf2/v5/availability/availability',
    {
      serviceId,
      fromDateTime: fromDt,
      toDateTime: toDt,
      'locationIds[]': LOCATION_ID,
      IncludeEmployees: 'true',
    }
  );

  const slots: TimeSlot[] = [];

  if (Array.isArray(data)) {
    for (const location of data) {
      for (const category of location.serviceCategories || []) {
        for (const service of category.services || []) {
          if (service.serviceId === serviceId) {
            for (const slotData of service.availability as BookerTimeSlot[]) {
              const employees = slotData.employees || [];
              slots.push({
                startTime: slotData.startDateTime || '',
                endTime: slotData.endDateTime || '',
                employeeId: employees[0]?.employeeId || null,
                employeeName: employees[0]?.employeeName || null,
              });
            }
          }
        }
      }
    }
  }

  return slots;
}

/**
 * Get availability for all target services across a date range.
 */
export async function getAllAvailability(
  fromDate: Date,
  toDate: Date,
  services?: Service[]
): Promise<AvailabilityByService> {
  const targetServices = services ?? (await getTargetServices());
  const result: AvailabilityByService = {};

  for (const service of targetServices) {
    const serviceId = service.id;
    const serviceName = service.name;
    result[serviceName] = {};

    // Get available dates
    const availableDates = await getAvailableDates(serviceId, fromDate, toDate);

    // Get time slots for each available date
    for (const dateStr of availableDates) {
      const dateObj = new Date(dateStr + 'T00:00:00');
      const slots = await getTimeSlots(serviceId, dateObj);
      if (slots.length > 0) {
        result[serviceName][dateStr] = slots;
      }
    }
  }

  return result;
}

/**
 * Format a Date object to YYYY-MM-DD string.
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Build booking URL for a specific service and date.
 */
export function buildBookingUrl(serviceId: number, serviceName: string, date: string): string {
  const encodedName = encodeURIComponent(serviceName);
  return `https://go.booker.com/location/${LOCATION_SLUG}/service/${serviceId}/${encodedName}/availability/${date}/any-provider`;
}
