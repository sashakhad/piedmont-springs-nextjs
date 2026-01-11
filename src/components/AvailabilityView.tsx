'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { SERVICE_CONFIG } from '@/lib/piedmont/constants';
import type { AvailabilityResponse, AvailabilityByDate, ServiceInfo } from '@/lib/piedmont/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, ExternalLink, Calendar, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildBookingUrl } from '@/lib/piedmont/client-utils';
import { getTodayPacific, getDatePlusDaysPacific, isTodayPacific, isTomorrowPacific, formatDateForDisplay } from '@/lib/piedmont/date-utils';

type DateRange = 'week' | 'two-weeks' | 'month';
type ViewMode = 'service' | 'date';

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
  const todayStr = getTodayPacific();
  const cutoffStr = getDatePlusDaysPacific(days);

  const filtered: Record<string, AvailabilityByDate> = {};

  for (const [serviceName, dates] of Object.entries(availability)) {
    filtered[serviceName] = {};
    for (const [dateStr, slots] of Object.entries(dates)) {
      // Include dates from today up to the cutoff
      if (dateStr >= todayStr && dateStr <= cutoffStr) {
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
  const [viewMode, setViewMode] = useState<ViewMode>('date');
  const [selectedService, setSelectedService] = useState<string>(SERVICE_CONFIG[0]?.name ?? '');

  // Always fetch full month - we'll filter locally for week/2-weeks
  const { data, error, isLoading, isValidating, mutate } = useSWR<AvailabilityResponse>(
    '/api/availability?days=30',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 15 * 60 * 1000, // Auto-refresh every 15 min (matches edge cache)
      dedupingInterval: 15 * 60 * 1000, // Don't refetch within 15 min
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

  // Reorganize data by date (for date-first view)
  const availabilityByDate = useMemo(() => {
    const byDate: Record<string, Array<{ serviceName: string; serviceId: number; slotCount: number }>> = {};
    
    for (const [serviceName, dates] of Object.entries(filteredAvailability)) {
      const serviceInfo = serviceMap.get(serviceName);
      if (!serviceInfo) continue;
      
      for (const [dateStr, slots] of Object.entries(dates)) {
        if (!byDate[dateStr]) {
          byDate[dateStr] = [];
        }
        byDate[dateStr].push({
          serviceName,
          serviceId: serviceInfo.id,
          slotCount: slots.length,
        });
      }
    }
    
    // Sort services within each date by slot count (descending)
    for (const dateStr of Object.keys(byDate)) {
      byDate[dateStr]?.sort((a, b) => b.slotCount - a.slotCount);
    }
    
    return byDate;
  }, [filteredAvailability, serviceMap]);

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
      {/* Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Date Range Selector */}
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
        
        {/* View Toggle + Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 p-0.5">
            <button
              onClick={() => setViewMode('date')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'date'
                  ? 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-200'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              )}
              title="View by date"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">By Date</span>
            </button>
            <button
              onClick={() => setViewMode('service')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'service'
                  ? 'bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-200'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
              )}
              title="View by service"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">By Service</span>
            </button>
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
      </div>

      {/* View Content */}
      {viewMode === 'service' ? (
        <>
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
        </>
      ) : (
        /* Date-first View */
        <DateFirstView availabilityByDate={availabilityByDate} serviceMap={serviceMap} />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 pt-4 dark:border-stone-700">
        <div className="flex flex-col items-center gap-2 text-center">
          <a
            href="https://go.booker.com/location/PiedmontSprings"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline dark:text-amber-500"
          >
            Book at piedmontsprings.com
            <ExternalLink className="h-3 w-3" />
          </a>
          {data?.fetchedAt && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Last updated {formatFetchTime(data.fetchedAt)}
            </p>
          )}
        </div>
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
  const { dayName, monthDay } = formatDateForDisplay(date);

  // Check if today/tomorrow in Pacific timezone
  const isToday = isTodayPacific(date);
  const isTomorrow = isTomorrowPacific(date);

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

function formatFetchTime(isoTime: string): string {
  const date = new Date(isoTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// --- Date First View Component ---

interface DateFirstViewProps {
  availabilityByDate: Record<string, Array<{ serviceName: string; serviceId: number; slotCount: number }>>;
  serviceMap: Map<string, ServiceInfo>;
}

function DateFirstView({ availabilityByDate, serviceMap }: DateFirstViewProps) {
  const sortedDates = Object.keys(availabilityByDate).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 py-12 text-center dark:border-stone-700 dark:bg-stone-900/50">
        <p className="text-stone-500 dark:text-stone-400">No availability in this time range</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const services = availabilityByDate[date];
        if (!services || services.length === 0) return null;

        return (
          <DateCard key={date} date={date} services={services} serviceMap={serviceMap} />
        );
      })}
    </div>
  );
}

interface DateCardProps {
  date: string;
  services: Array<{ serviceName: string; serviceId: number; slotCount: number }>;
  serviceMap: Map<string, ServiceInfo>;
}

function DateCard({ date, services, serviceMap }: DateCardProps) {
  const { dayName, monthDay } = formatDateForDisplay(date);
  const isToday = isTodayPacific(date);
  const isTomorrow = isTomorrowPacific(date);

  // Get icon for service
  const getServiceIcon = (serviceName: string): string => {
    const config = SERVICE_CONFIG.find((c) => c.name === serviceName);
    return config?.icon ?? '📅';
  };

  // Get short name for service
  const getShortName = (serviceName: string): string => {
    return serviceName
      .replace(/^\d+\s*Minute\s*/, '')
      .replace('One Hour ', '');
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/50'
      )}
    >
      {/* Date Header */}
      <div className="mb-3 flex items-baseline gap-3">
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            isToday
              ? 'text-amber-600 dark:text-amber-400'
              : isTomorrow
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-stone-400 dark:text-stone-500'
          )}
        >
          {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayName}
        </span>
        <span className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          {monthDay}
        </span>
      </div>

      {/* Services Grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(({ serviceName, serviceId, slotCount }) => {
          const serviceInfo = serviceMap.get(serviceName);
          const bookingUrl = buildBookingUrl(serviceId, serviceName, date);

          return (
            <a
              key={serviceName}
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group flex items-center gap-3 rounded-lg border p-3 transition-all',
                'border-stone-100 bg-stone-50 hover:border-amber-400 hover:bg-amber-50',
                'dark:border-stone-700 dark:bg-stone-800 dark:hover:border-amber-500 dark:hover:bg-stone-700'
              )}
            >
              <span className="text-xl">{getServiceIcon(serviceName)}</span>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium text-stone-700 group-hover:text-amber-700 dark:text-stone-300 dark:group-hover:text-amber-400">
                  {getShortName(serviceName)}
                </div>
                {serviceInfo && (
                  <div className="text-xs text-stone-400 dark:text-stone-500">
                    ${serviceInfo.price} · {serviceInfo.durationMinutes}min
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  {slotCount}
                </span>
                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 dark:text-stone-600" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
