/**
 * Availability API Route
 *
 * GET /api/availability?days=30
 *
 * Returns availability data for all target services.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllAvailability, getTargetServices } from '@/lib/piedmont/api-client';
import { DEFAULT_DAYS } from '@/lib/piedmont/constants';
import { getTodayPacific, getDatePlusDaysPacific } from '@/lib/piedmont/date-utils';
import type { AvailabilityResponse } from '@/lib/piedmont/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for this route

export async function GET(request: NextRequest): Promise<NextResponse<AvailabilityResponse | { error: string }>> {
  try {
    // Parse days parameter
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10), 1), 60) : DEFAULT_DAYS;

    // Calculate date range in Pacific timezone
    const fromDateStr = getTodayPacific();
    const toDateStr = getDatePlusDaysPacific(days);
    
    // Convert to Date objects for the API (use noon to avoid DST issues)
    const fromDate = new Date(`${fromDateStr}T12:00:00-08:00`);
    const toDate = new Date(`${toDateStr}T12:00:00-08:00`);

    // Fetch services first
    const services = await getTargetServices();
    const servicesInfo = services.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMinutes: s.durationMinutes,
    }));

    // Fetch availability
    const availability = await getAllAvailability(fromDate, toDate, services);

    const response: AvailabilityResponse = {
      availability,
      services: servicesInfo,
      fromDate: fromDateStr,
      toDate: toDateStr,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 1 hour on CDN, allow stale for 4 hours while revalidating
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=14400',
      },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
