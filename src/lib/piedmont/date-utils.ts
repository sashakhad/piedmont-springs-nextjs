/**
 * Date utilities with Pacific timezone support using date-fns
 * 
 * Piedmont Springs is in California, so all dates should be in Pacific time.
 */

import { format, addDays, parse } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

/**
 * Get today's date string in Pacific timezone (YYYY-MM-DD)
 */
export function getTodayPacific(): string {
  const now = new Date();
  return formatInTimeZone(now, PACIFIC_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get a date string in Pacific timezone (YYYY-MM-DD) for a given Date object
 */
export function formatDatePacific(date: Date): string {
  return formatInTimeZone(date, PACIFIC_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get a date string for N days from today in Pacific timezone
 */
export function getDatePlusDaysPacific(daysFromNow: number): string {
  const now = new Date();
  const pacificNow = toZonedTime(now, PACIFIC_TIMEZONE);
  const futureDate = addDays(pacificNow, daysFromNow);
  return format(futureDate, 'yyyy-MM-dd');
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
  // Parse the date string as a local date (not UTC)
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  
  const dayName = format(date, 'EEE'); // Mon, Tue, etc.
  const monthDay = format(date, 'MMM d'); // Jan 10, etc.
  
  return { dayName, monthDay };
}
