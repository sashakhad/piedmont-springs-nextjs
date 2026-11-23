/**
 * @jest-environment node
 */

import { clearTokenCache } from '../token-service';
import { getAllServices } from '../api-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function guestToken(accessToken: string): unknown {
  return {
    access_token: accessToken,
    expires_in: 14400,
    token_type: 'Bearer',
  };
}

function menuPayload(serviceId: number, name: string): unknown {
  return {
    Data: [
      {
        MenuGroups: [
          {
            Name: 'Spa',
            MenuGroupItems: [
              {
                ServiceId: serviceId,
                Name: name,
                DisplayDuration: '55 min',
                DisplayPrice: '$32.00',
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('api client token retry', () => {
  const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn();

  beforeEach(() => {
    clearTokenCache();
    delete process.env['BOOKER_TOKEN'];
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    clearTokenCache();
  });

  afterAll(() => {
    fetchMock.mockReset();
  });

  it('refreshes the guest token once after a 401 and retries the request', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(guestToken('stale-token')))
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse(guestToken('fresh-token')))
      .mockResolvedValueOnce(jsonResponse(menuPayload(3626383, 'One Hour Hot Tub')));

    const services = await getAllServices();

    expect(services).toEqual([
      {
        id: 3626383,
        name: 'One Hour Hot Tub',
        durationMinutes: 55,
        price: 32,
        category: 'Spa',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(4);

    const retryUrl = String(fetchMock.mock.calls[3]?.[0]);
    expect(retryUrl).toContain('access_token=fresh-token');
    const retryHeaders = new Headers(fetchMock.mock.calls[3]?.[1]?.headers);
    expect(retryHeaders.get('Authorization')).toBe('Bearer fresh-token');
  });

  it('does not retry a 401 more than once', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(guestToken('stale-token')))
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse(guestToken('still-rejected')))
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401));

    await expect(getAllServices()).rejects.toThrow('API request failed: 401');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
