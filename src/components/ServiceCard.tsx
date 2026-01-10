'use client';

import { cn } from '@/lib/utils';
import { TimeSlotPill, TimeSlotOverflow } from './TimeSlotPill';
import type { AvailabilityByDate, TimeSlot } from '@/lib/piedmont/types';
import { buildBookingUrl } from '@/lib/piedmont/client-utils';

interface ServiceCardProps {
  serviceName: string;
  serviceId: number;
  icon: string;
  availability: AvailabilityByDate;
}

/**
 * Get hour from ISO time string
 */
function getHour(timeStr: string): number {
  if (!timeStr.includes('T')) return 0;
  const timePart = timeStr.split('T')[1].slice(0, 5);
  return parseInt(timePart.split(':')[0], 10);
}

/**
 * Group slots by time of day
 */
function groupSlotsByTimeOfDay(slots: TimeSlot[]): {
  morning: string[];
  afternoon: string[];
  evening: string[];
} {
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];

  for (const slot of slots) {
    const hour = getHour(slot.startTime);
    if (hour < 12) {
      morning.push(slot.startTime);
    } else if (hour < 17) {
      afternoon.push(slot.startTime);
    } else {
      evening.push(slot.startTime);
    }
  }

  return { morning, afternoon, evening };
}

/**
 * Format date string to readable format (e.g., "Sat, Jan 11")
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface TimeRowProps {
  label: string;
  times: string[];
  maxShow?: number;
}

function TimeRow({ label, times, maxShow = 5 }: TimeRowProps) {
  if (times.length === 0) return null;

  const shown = times.slice(0, maxShow);
  const overflow = times.length - maxShow;

  return (
    <div className='flex items-baseline gap-3'>
      <span className='min-w-[60px] shrink-0 text-xs font-medium text-stone-400 dark:text-stone-500'>
        {label}
      </span>
      <div className='flex flex-wrap items-center gap-1.5'>
        {shown.map((time, i) => (
          <TimeSlotPill key={i} time={time} />
        ))}
        {overflow > 0 && <TimeSlotOverflow count={overflow} />}
      </div>
    </div>
  );
}

interface DateCardProps {
  date: string;
  slots: TimeSlot[];
  serviceId: number;
  serviceName: string;
}

function DateCard({ date, slots, serviceId, serviceName }: DateCardProps) {
  const { morning, afternoon, evening } = groupSlotsByTimeOfDay(slots);
  const bookingUrl = buildBookingUrl(serviceId, serviceName, date);

  return (
    <a
      href={bookingUrl}
      target='_blank'
      rel='noopener noreferrer'
      className={cn(
        'block rounded-lg border border-stone-200 bg-white p-4 transition-all',
        'hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/10',
        'dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-amber-500'
      )}
    >
      <div className='mb-3 font-semibold text-stone-800 dark:text-stone-200'>
        {formatDateLabel(date)}
      </div>
      <div className='flex flex-col gap-2'>
        <TimeRow label='Morning' times={morning} />
        <TimeRow label='Afternoon' times={afternoon} />
        <TimeRow label='Evening' times={evening} />
      </div>
    </a>
  );
}

export function ServiceCard({ serviceName, serviceId, icon, availability }: ServiceCardProps) {
  const sortedDates = Object.keys(availability).sort();
  const hasAvailability = sortedDates.length > 0;

  return (
    <div className='space-y-3'>
      <h3 className='text-lg font-semibold text-stone-800 dark:text-stone-200'>
        {icon} {serviceName}
      </h3>

      {hasAvailability ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {sortedDates.map((date) => (
            <DateCard
              key={date}
              date={date}
              slots={availability[date]}
              serviceId={serviceId}
              serviceName={serviceName}
            />
          ))}
        </div>
      ) : (
        <p className='py-2 italic text-stone-400 dark:text-stone-500'>No availability</p>
      )}
    </div>
  );
}
