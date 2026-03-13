import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStreamApi, LoopMode } from './api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Response-like object that fetch returns.
 * `ok` drives the error-path; `body` is what handleResponse parses.
 */
function mockResponse(body: unknown, ok = true): Response {
    return {
        ok,
        status: ok ? 200 : 400,
        text: () => Promise.resolve(ok ? JSON.stringify(body) : String(body)),
    } as unknown as Response;
}

// Replace the global fetch with a Vitest spy before each test.
// The first argument is re-assigned per test with mockResolvedValueOnce.
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
});

// ---------------------------------------------------------------------------
// createStreamApi — URL correctness
// ---------------------------------------------------------------------------

describe('createStreamApi', () => {
    const STREAM_ID = 'abc123';
    const api = createStreamApi(STREAM_ID);

    // --- simple POST commands --------------------------------------------------

    it.each([
        ['skip',    '/api/player/abc123/skip'],
        ['pause',   '/api/player/abc123/pause'],
        ['resume',  '/api/player/abc123/resume'],
        ['stop',    '/api/player/abc123/stop'],
        ['shuffle', '/api/player/abc123/shuffle'],
    ])('%s() POSTs to %s', async (method, expectedUrl) => {
        fetchSpy.mockResolvedValueOnce(mockResponse({}));
        await (api[method as keyof typeof api] as () => Promise<unknown>)();
        expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, { method: 'POST' });
    });

    // --- setLoopMode -----------------------------------------------------------

    it('setLoopMode sends the correct loop path', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({}));
        await api.setLoopMode(LoopMode.QUEUE);
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/player/abc123/loop/queue',
            { method: 'POST' }
        );
    });

    // --- seek ------------------------------------------------------------------

    it('seek POSTs position as text body', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({}));
        await api.seek(42000);
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/player/abc123/seek',
            expect.objectContaining({
                method: 'POST',
                body: '42000',
            })
        );
    });

    // --- add ------------------------------------------------------------------

    it('add sends url, next, shuffle in JSON body', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({}));
        await api.add('https://example.com/track', true, false);
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/player/abc123/add',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'https://example.com/track', next: true, shuffle: false }),
            })
        );
    });

    it('add defaults next=false and shuffle=false', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({}));
        await api.add('https://example.com/track');
        const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
        expect(body).toEqual({ url: 'https://example.com/track', next: false, shuffle: false });
    });

    // --- removeFromQueue -------------------------------------------------------

    it('removeFromQueue sends DELETE to the correct index URL', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({}));
        await api.removeFromQueue(3);
        expect(fetchSpy).toHaveBeenCalledWith('/api/queue/abc123/3', { method: 'DELETE' });
    });

    // --- moveQueueItem ---------------------------------------------------------

    it('moveQueueItem sends from/to/uri in JSON body', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse({}));
        await api.moveQueueItem(1, 4, 'https://example.com/track');
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/queue/abc123/move',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ from: 1, to: 4, uri: 'https://example.com/track' }),
            })
        );
    });

    // --- search ----------------------------------------------------------------

    it('search builds correct query params', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse([]));
        await api.search('lofi beats', 'youtube', 'track');
        const calledUrl = fetchSpy.mock.calls[0][0] as string;
        expect(calledUrl).toContain('/api/search/abc123');
        expect(calledUrl).toContain('query=lofi+beats');
        expect(calledUrl).toContain('source=youtube');
        expect(calledUrl).toContain('types=track');
    });

    it('search defaults types to "track"', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse([]));
        await api.search('test', 'deezer');
        const calledUrl = fetchSpy.mock.calls[0][0] as string;
        expect(calledUrl).toContain('types=track');
    });

    // --- error handling --------------------------------------------------------

    it('rejects with an Error when the server returns a non-ok response', async () => {
        fetchSpy.mockResolvedValueOnce(mockResponse('Bad Request', false));
        await expect(api.skip()).rejects.toThrow('API Error: 400');
    });
});
