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
import type { AvailabilityResponse } from '@/lib/piedmont/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for this route

export async function GET(request: NextRequest): Promise<NextResponse<AvailabilityResponse | { error: string }>> {
  try {
    // Parse days parameter
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10), 1), 60) : DEFAULT_DAYS;

    // Calculate date range
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + days);

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

    const formatDate = (d: Date): string => {
      const parts = d.toISOString().split('T');
      return parts[0] ?? '';
    };

    const response: AvailabilityResponse = {
      availability,
      services: servicesInfo,
      fromDate: formatDate(fromDate),
      toDate: formatDate(toDate),
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 5 minutes on CDN, allow stale for 1 hour while revalidating
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
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
