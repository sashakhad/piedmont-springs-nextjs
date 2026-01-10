'use client';

import { cn } from '@/lib/utils';

interface TimeSlotPillProps {
  time: string;
  className?: string;
}

/**
 * Format ISO time string to readable format (e.g., "2:30pm")
 */
function formatTime(isoTime: string): string {
  const parts = isoTime.split('T');
  const timePart = parts[1];
  if (!timePart) {return isoTime;}

  const timeComponents = timePart.slice(0, 5).split(':');
  const hourStr = timeComponents[0] ?? '0';
  const minuteStr = timeComponents[1] ?? '0';
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const period = hour < 12 ? 'am' : 'pm';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute.toString().padStart(2, '0')}${period}`;
}

export function TimeSlotPill({ time, className }: TimeSlotPillProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-md bg-stone-100 px-2 py-0.5 text-sm tabular-nums text-stone-700 dark:bg-stone-800 dark:text-stone-300',
        className
      )}
    >
      {formatTime(time)}
    </span>
  );
}

interface TimeSlotOverflowProps {
  count: number;
}

export function TimeSlotOverflow({ count }: TimeSlotOverflowProps) {
  return <span className='text-xs italic text-stone-400 dark:text-stone-500'>+{count} more</span>;
}
