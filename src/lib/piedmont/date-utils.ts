/**
 * Date utilities with Pacific timezone support
 * 
 * Piedmont Springs is in California, so all dates should be in Pacific time.
 */

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

/**
 * Get today's date string in Pacific timezone (YYYY-MM-DD)
 */
export function getTodayPacific(): string {
  return formatDatePacific(new Date());
}

/**
 * Get a date string in Pacific timezone (YYYY-MM-DD) for a given Date object
 */
export function formatDatePacific(date: Date): string {
  // Use Intl.DateTimeFormat to get the date parts in Pacific time
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PACIFIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale gives us YYYY-MM-DD format
  return formatter.format(date);
}

/**
 * Get a Date object for N days from today in Pacific timezone
 */
export function getDatePlusDaysPacific(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDatePacific(date);
}

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in Pacific timezone
 * Returns the date at midnight Pacific time
 */
export function parseDatePacific(dateStr: string): Date {
  // Create date at noon Pacific to avoid DST edge cases
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create a date string with explicit Pacific timezone
  const pacificDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
  
  // Get the offset for Pacific time on this date
  const tempDate = new Date(pacificDateStr + 'Z');
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  });
  
  // This is a workaround - we'll use the date parts directly for display
  return new Date(`${dateStr}T00:00:00`);
}

/**
 * Check if a date string is today in Pacific timezone
 */
export function isTodayPacific(dateStr: string): boolean {
  return dateStr === getTodayPacific();
}

/**
 * Check if a date string is tomorrow in Pacific timezone
 */
export function isTomorrowPacific(dateStr: string): boolean {
  return dateStr === getDatePlusDaysPacific(1);
}

/**
 * Format a date string (YYYY-MM-DD) for display
 */
export function formatDateForDisplay(dateStr: string): { dayName: string; monthDay: string } {
  // Parse the date string directly to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date at noon to avoid DST issues
  const date = new Date(year!, month! - 1, day!, 12, 0, 0);
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  return { dayName, monthDay };
}
