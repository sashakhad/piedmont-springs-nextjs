/**
 * Piedmont Springs Availability Types
 *
 * TypeScript interfaces for the Booker/Mindbody API data structures.
 */

export interface Service {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
  category: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  employeeId: number | null;
  employeeName: string | null;
}

export interface AvailabilityByDate {
  [date: string]: TimeSlot[];
}

export interface AvailabilityByService {
  [serviceName: string]: AvailabilityByDate;
}

export interface ServiceInfo {
  id: number;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface AvailabilityResponse {
  availability: AvailabilityByService;
  services: ServiceInfo[];
  fromDate: string;
  toDate: string;
  fetchedAt: string;
}

// API response types from Booker
export interface BookerMenuSection {
  MenuGroups: BookerMenuGroup[];
}

export interface BookerMenuGroup {
  Name: string;
  MenuGroupItems: BookerMenuItem[];
}

export interface BookerMenuItem {
  ServiceId: number | null;
  Name: string;
  DisplayDuration: string;
  DisplayPrice: string;
}

export interface BookerAvailabilityLocation {
  serviceCategories: BookerServiceCategory[];
}

export interface BookerServiceCategory {
  services: BookerServiceAvailability[];
}

export interface BookerServiceAvailability {
  serviceId: number;
  availability: string[] | BookerTimeSlot[];
}

export interface BookerTimeSlot {
  startDateTime: string;
  endDateTime: string;
  employees: BookerEmployee[];
}

export interface BookerEmployee {
  employeeId: number;
  employeeName: string;
}
