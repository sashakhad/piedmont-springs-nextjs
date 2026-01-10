'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { SERVICE_CONFIG } from '@/lib/piedmont/constants';
import type { AvailabilityResponse, AvailabilityByDate, ServiceInfo } from '@/lib/piedmont/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildBookingUrl } from '@/lib/piedmont/client-utils';

type DateRange = 'week' | 'two-weeks' | 'month';

const DATE_RANGES: Array<{ key: DateRange; label: string; days: number }> = [
  { key: 'week', label: 'This Week', days: 7 },
  { key: 'two-weeks', label: '2 Weeks', days: 14 },
  { key: 'month', label: 'Month', days: 30 },
];

const fetcher = async (url: string): Promise<AvailabilityResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch availability');
  }
  return response.json();
};

/**
 * Filter availability data to only include dates within the specified range
 */
function filterAvailabilityByDays(
  availability: Record<string, AvailabilityByDate>,
  days: number
): Record<string, AvailabilityByDate> {
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  const cutoffStr = cutoff.toISOString().split('T')[0] ?? '';

  const filtered: Record<string, AvailabilityByDate> = {};

  for (const [serviceName, dates] of Object.entries(availability)) {
    filtered[serviceName] = {};
    for (const [dateStr, slots] of Object.entries(dates)) {
      if (dateStr <= cutoffStr) {
        filtered[serviceName][dateStr] = slots;
      }
    }
  }

  return filtered;
}

interface AvailabilityViewProps {
  initialData?: AvailabilityResponse | null;
}

export function AvailabilityView({ initialData }: AvailabilityViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [selectedService, setSelectedService] = useState<string>(SERVICE_CONFIG[0]?.name ?? '');

  // Always fetch full month - we'll filter locally for week/2-weeks
  const { data, error, isLoading, isValidating, mutate } = useSWR<AvailabilityResponse>(
    '/api/availability?days=30',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60 * 60 * 1000, // Auto-refresh every hour
      dedupingInterval: 5 * 60 * 1000, // Don't refetch within 5 minutes
      ...(initialData ? { fallbackData: initialData } : {}),
    }
  );

  const loading = isLoading;
  const refreshing = isValidating && !isLoading;

  // Filter availability based on selected date range
  const currentDays = DATE_RANGES.find((r) => r.key === dateRange)?.days ?? 7;
  
  const filteredAvailability = useMemo(() => {
    if (!data?.availability) return {};
    return filterAvailabilityByDays(data.availability, currentDays);
  }, [data?.availability, currentDays]);

  // Build service lookup
  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceInfo>();
    if (data) {
      for (const service of data.services) {
        map.set(service.name, service);
      }
    }
    return map;
  }, [data]);

  const selectedServiceInfo = serviceMap.get(selectedService);
  const selectedAvailability = filteredAvailability[selectedService] ?? {};

  // Count slots per service for the filtered range
  const serviceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const config of SERVICE_CONFIG) {
      const availability = filteredAvailability[config.name] ?? {};
      counts[config.name] = Object.values(availability).reduce(
        (sum, slots) => sum + slots.length,
        0
      );
    }
    return counts;
  }, [filteredAvailability]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-stone-500 dark:text-stone-400">Loading availability...</p>
        <p className="text-sm text-stone-400 dark:text-stone-500">
          This may take a moment on first load
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600 dark:text-red-400">
            Error loading availability
          </p>
          <p className="mt-1 text-stone-500 dark:text-stone-400">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
        <Button onClick={() => mutate()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {DATE_RANGES.map((range) => (
            <Button
              key={range.key}
              variant={dateRange === range.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range.key)}
              className={cn(
                dateRange === range.key
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-stone-300 dark:border-stone-600'
              )}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              {range.label}
            </Button>
          ))}
        </div>
        <Button
          onClick={() => mutate()}
          variant="ghost"
          size="sm"
          disabled={refreshing}
          title="Refresh availability"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </Button>
      </div>

      {/* Service Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-stone-200 dark:border-stone-700 pb-px">
        {SERVICE_CONFIG.map((config) => {
          const isSelected = selectedService === config.name;
          const totalSlots = serviceCounts[config.name] ?? 0;

          return (
            <button
              key={config.name}
              onClick={() => setSelectedService(config.name)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
                'border-b-2 -mb-px',
                isSelected
                  ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              )}
            >
              <span>{config.icon}</span>
              <span className="hidden sm:inline">{config.name.replace(/^\d+\s*Minute\s*/, '').replace('One Hour ', '')}</span>
              {totalSlots > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    isSelected
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                  )}
                >
                  {totalSlots}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Service Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
            {selectedService}
          </h2>
          {selectedServiceInfo && (
            <span className="text-sm text-stone-500 dark:text-stone-400">
              ${selectedServiceInfo.price} · {selectedServiceInfo.durationMinutes} min
            </span>
          )}
        </div>

        <AvailabilityGrid
          availability={selectedAvailability}
          serviceId={selectedServiceInfo?.id ?? 0}
          serviceName={selectedService}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 pt-4 text-center dark:border-stone-700">
        <a
          href="https://go.booker.com/location/PiedmontSprings"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline dark:text-amber-500"
        >
          Book at piedmontsprings.com
          <ExternalLink className="h-3 w-3" />
        </a>
      </footer>
    </div>
  );
}

// --- Availability Grid Component ---

interface AvailabilityGridProps {
  availability: AvailabilityByDate;
  serviceId: number;
  serviceName: string;
}

function AvailabilityGrid({ availability, serviceId, serviceName }: AvailabilityGridProps) {
  const sortedDates = Object.keys(availability).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 py-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
        <p className="text-stone-500 dark:text-stone-400">No availability in this time range</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDates.map((date) => {
        const slots = availability[date];
        if (!slots) return null;

        return (
          <DateRow
            key={date}
            date={date}
            slots={slots}
            serviceId={serviceId}
            serviceName={serviceName}
          />
        );
      })}
    </div>
  );
}

// --- Date Row Component ---

interface DateRowProps {
  date: string;
  slots: Array<{ startTime: string; endTime: string; employeeId: number | null; employeeName: string | null }>;
  serviceId: number;
  serviceName: string;
}

function DateRow({ date, slots, serviceId, serviceName }: DateRowProps) {
  const bookingUrl = buildBookingUrl(serviceId, serviceName, date);
  const dateObj = new Date(`${date}T00:00:00`);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Check if today/tomorrow by comparing date strings
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const isToday = date === todayStr;
  const isTomorrow = date === tomorrowStr;

  // Group by time of day
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];

  for (const slot of slots) {
    const hour = parseInt(slot.startTime.split('T')[1]?.slice(0, 2) ?? '0', 10);
    const formatted = formatTime(slot.startTime);
    if (hour < 12) {
      morning.push(formatted);
    } else if (hour < 17) {
      afternoon.push(formatted);
    } else {
      evening.push(formatted);
    }
  }

  return (
    <a
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-start gap-4 rounded-lg border p-4 transition-all',
        'border-stone-200 bg-white hover:border-amber-500 hover:shadow-md',
        'dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-amber-500'
      )}
    >
      {/* Date Column */}
      <div className="w-16 shrink-0 text-center">
        <div
          className={cn(
            'text-xs font-medium uppercase',
            isToday
              ? 'text-amber-600 dark:text-amber-400'
              : isTomorrow
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-stone-400 dark:text-stone-500'
          )}
        >
          {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayName}
        </div>
        <div className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          {monthDay}
        </div>
      </div>

      {/* Times Grid */}
      <div className="flex-1 space-y-2">
        <TimeSection label="AM" times={morning} />
        <TimeSection label="PM" times={afternoon} />
        <TimeSection label="Eve" times={evening} />
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 shrink-0 text-stone-300 transition-colors group-hover:text-amber-500 dark:text-stone-600" />
    </a>
  );
}

function TimeSection({ label, times }: { label: string; times: string[] }) {
  if (times.length === 0) return null;

  return (
    <div className="flex items-baseline gap-2">
      <span className="w-8 shrink-0 text-xs font-medium text-stone-400 dark:text-stone-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {times.map((time, i) => (
          <span
            key={i}
            className="rounded bg-stone-100 px-1.5 py-0.5 text-xs tabular-nums text-stone-600 dark:bg-stone-700 dark:text-stone-300"
          >
            {time}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatTime(isoTime: string): string {
  const timePart = isoTime.split('T')[1];
  if (!timePart) return isoTime;

  const [hourStr, minuteStr] = timePart.slice(0, 5).split(':');
  const hour = parseInt(hourStr ?? '0', 10);
  const minute = parseInt(minuteStr ?? '0', 10);
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute.toString().padStart(2, '0')}`;
}
