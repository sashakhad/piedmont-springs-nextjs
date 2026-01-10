'use client';

import { useEffect, useState } from 'react';
import { ServiceCard } from './ServiceCard';
import { SERVICE_CONFIG, SECTION_TITLES, DEFAULT_DAYS } from '@/lib/piedmont/constants';
import type { AvailabilityResponse, ServiceInfo } from '@/lib/piedmont/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, ExternalLink } from 'lucide-react';

interface AvailabilityViewProps {
  initialData?: AvailabilityResponse | null;
}

export function AvailabilityView({ initialData }: AvailabilityViewProps) {
  const [data, setData] = useState<AvailabilityResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  async function fetchAvailability() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/availability?days=${DEFAULT_DAYS}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch availability');
      }
      const result: AvailabilityResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialData) {
      fetchAvailability();
    }
  }, [initialData]);

  // Build service lookup
  const serviceMap = new Map<string, ServiceInfo>();
  if (data) {
    for (const service of data.services) {
      serviceMap.set(service.name, service);
    }
  }

  // Format date range for display
  const formatDateRange = () => {
    if (!data) return '';
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    return `${from.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${to.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };

  // Format fetch time
  const formatFetchTime = () => {
    if (!data) return '';
    const fetchedAt = new Date(data.fetchedAt);
    return fetchedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading && !data) {
    return (
      <div className='flex min-h-[400px] flex-col items-center justify-center gap-4'>
        <Loader2 className='h-8 w-8 animate-spin text-amber-600' />
        <p className='text-stone-500 dark:text-stone-400'>Loading availability...</p>
        <p className='text-sm text-stone-400 dark:text-stone-500'>
          This may take a moment on first load
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-[400px] flex-col items-center justify-center gap-4'>
        <div className='text-center'>
          <p className='text-lg font-medium text-red-600 dark:text-red-400'>Error loading availability</p>
          <p className='mt-1 text-stone-500 dark:text-stone-400'>{error}</p>
        </div>
        <Button onClick={fetchAvailability} variant='outline'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Header Info */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-stone-500 dark:text-stone-400'>{formatDateRange()}</p>
          <p className='text-sm text-stone-400 dark:text-stone-500'>Updated {formatFetchTime()}</p>
        </div>
        <Button
          onClick={fetchAvailability}
          variant='outline'
          size='sm'
          disabled={loading}
          className='border-stone-300 dark:border-stone-600'
        >
          {loading ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <RefreshCw className='mr-2 h-4 w-4' />
          )}
          Refresh
        </Button>
      </div>

      {/* Service Groups */}
      {data && (
        <div className='space-y-10'>
          {SERVICE_CONFIG.map((config, index) => {
            const service = serviceMap.get(config.name);
            const availability = data.availability[config.name] || {};

            // Check if this is the start of a new section
            const sectionTitle = SECTION_TITLES[index];

            return (
              <div key={config.name}>
                {sectionTitle && (
                  <h2 className='mb-6 border-b border-stone-200 pb-2 text-sm font-semibold uppercase tracking-wider text-stone-400 dark:border-stone-700 dark:text-stone-500'>
                    {sectionTitle}
                  </h2>
                )}
                <ServiceCard
                  serviceName={config.name}
                  serviceId={service?.id ?? 0}
                  icon={config.icon}
                  availability={availability}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer className='border-t border-stone-200 pt-6 text-center dark:border-stone-700'>
        <a
          href='https://go.booker.com/location/PiedmontSprings'
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 text-amber-600 hover:underline dark:text-amber-500'
        >
          Book at piedmontsprings.com
          <ExternalLink className='h-3 w-3' />
        </a>
      </footer>
    </div>
  );
}
