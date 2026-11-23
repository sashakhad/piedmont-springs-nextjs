/**
 * @jest-environment node
 */

import { BOOKER_TOKEN_URL, SUBSCRIPTION_KEY, TOKEN_REFRESH_BUFFER_MS } from '../constants';
import { clearTokenCache, getAccessToken, refreshAccessToken } from '../token-service';

const ORIGINAL_BOOKER_TOKEN = process.env['BOOKER_TOKEN'];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function guestToken(accessToken: string, expiresIn = 14400): unknown {
  return {
    access_token: accessToken,
    expires_in: expiresIn,
    token_type: 'Bearer',
  };
}

describe('token service', () => {
  const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn();

  beforeEach(() => {
    clearTokenCache();
    delete process.env['BOOKER_TOKEN'];
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    clearTokenCache();
    if (ORIGINAL_BOOKER_TOKEN === undefined) {
      delete process.env['BOOKER_TOKEN'];
    } else {
      process.env['BOOKER_TOKEN'] = ORIGINAL_BOOKER_TOKEN;
    }
  });

  afterAll(() => {
    fetchMock.mockReset();
  });

  it('requests a guest token from the Booker connect endpoint and caches it', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(guestToken('guest-token')));

    await expect(getAccessToken()).resolves.toBe('guest-token');
    await expect(getAccessToken()).resolves.toBe('guest-token');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(BOOKER_TOKEN_URL);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{}');

    const headers = new Headers(init?.headers);
    expect(headers.get('Ocp-Apim-Subscription-Key')).toBe(SUBSCRIPTION_KEY);
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('shares one in-flight guest token request', async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>(resolve => {
          resolveFetch = resolve;
        })
    );

    const first = getAccessToken();
    const second = getAccessToken();
    resolveFetch?.(jsonResponse(guestToken('shared-token')));

    await expect(Promise.all([first, second])).resolves.toEqual(['shared-token', 'shared-token']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes the cached token before it expires', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-23T20:00:00.000Z') });
    fetchMock.mockResolvedValueOnce(jsonResponse(guestToken('token-a', 120)));

    await expect(getAccessToken()).resolves.toBe('token-a');

    jest.setSystemTime(Date.now() + TOKEN_REFRESH_BUFFER_MS - 1000);
    await expect(getAccessToken()).resolves.toBe('token-a');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    jest.setSystemTime(Date.now() + 1000);
    fetchMock.mockResolvedValueOnce(jsonResponse(guestToken('token-b', 120)));
    await expect(getAccessToken()).resolves.toBe('token-b');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('uses BOOKER_TOKEN only when the guest token request fails', async () => {
    process.env['BOOKER_TOKEN'] = 'pasted-token';
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'unavailable' }, 503));

    await expect(getAccessToken()).resolves.toBe('pasted-token');
    await expect(getAccessToken()).resolves.toBe('pasted-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not reuse a rejected BOOKER_TOKEN fallback', async () => {
    process.env['BOOKER_TOKEN'] = 'expired-pasted-token';
    fetchMock.mockResolvedValue(jsonResponse({ message: 'unavailable' }, 503));

    await expect(getAccessToken()).resolves.toBe('expired-pasted-token');
    await expect(refreshAccessToken('expired-pasted-token')).rejects.toThrow(
      'Booker guest token request failed: 503'
    );
  });

  it('throws when the guest token response is not a token and no fallback is set', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await expect(getAccessToken()).rejects.toThrow('missing access_token or expires_in');
  });
});
