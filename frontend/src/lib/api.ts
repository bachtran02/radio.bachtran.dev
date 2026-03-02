const STREAM_API_BASE = '/api/stream';
const PLAYER_API_BASE = '/api/player';
const QUEUE_API_BASE  = '/api/queue';
const SEARCH_API_BASE = '/api/search';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export const LoopMode = {
    NONE:  'none',
    TRACK: 'track',
    QUEUE: 'queue',
} as const;

export type LoopMode = typeof LoopMode[keyof typeof LoopMode];

export interface SearchResultTrack {
    type: 'track';
    title: string;
    author: string;
    artworkUrl: string;
    uri: string;
    duration: number;
    stream: boolean;
}

export interface SearchResultPlaylist {
    type: 'playlist';
    title: string;
    author: string;
    artworkUrl: string;
    uri: string;
    numItems: number;
    playlistType: string;
}

export type SearchResult = SearchResultTrack | SearchResultPlaylist;

export interface StreamState {
    active: boolean;
    identifier: string | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`API Error: ${res.status} - ${errorText}`);
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
}

function post(url: string): Promise<unknown> {
    return fetch(url, { method: 'POST' }).then(handleResponse);
}

// ---------------------------------------------------------------------------
// Stream-scoped API factory
// Call once with a streamId; every returned method is already bound to it.
// ---------------------------------------------------------------------------

export type StreamApi = ReturnType<typeof createStreamApi>;

export function createStreamApi(streamId: string) {
    const stream_path = `${STREAM_API_BASE}/${streamId}`;
    const player_path = `${PLAYER_API_BASE}/${streamId}`;
    const queue_path  = `${QUEUE_API_BASE}/${streamId}`;
    const search_path = `${SEARCH_API_BASE}/${streamId}`;

    const command = (path: string) => post(`${player_path}/${path}`);

    return {
        // Stream control
        startStream: async (): Promise<void> => {
            const res = await fetch(`${stream_path}/start`, { method: 'POST' });
            if (!res.ok) {
                const errorText = await res.text().catch(() => 'Unknown error');
                throw new Error(`Failed to start stream: ${res.status} - ${errorText}`);
            }
        },

        // Playback controls
        skip:    () => command('skip'),
        pause:   () => command('pause'),
        resume:  () => command('resume'),
        stop:    () => command('stop'),
        shuffle: () => command('shuffle'),

        setLoopMode: (mode: LoopMode) => command(`loop/${mode}`),

        seek: (position: number) =>
            fetch(`${player_path}/seek`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: position.toString(),
            }).then(handleResponse),

        // Queue management
        play: (url: string) =>
            fetch(`${player_path}/play`, { method: 'POST', body: url }).then(handleResponse),

        add: (url: string, next = false, shuffle = false) =>
            fetch(`${player_path}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, next, shuffle }),
            }).then(handleResponse),

        removeFromQueue: (index: number) =>
            fetch(`${queue_path}/${index}`, { method: 'DELETE' }).then(handleResponse),

        moveQueueItem: (fromIndex: number, toIndex: number, uri: string) =>
            fetch(`${queue_path}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: fromIndex, to: toIndex, uri }),
            }).then(handleResponse),

        // Search
        search: (query: string, source: string, types = 'track'): Promise<SearchResult[]> => {
            const params = new URLSearchParams({ query, source, types });
            return fetch(`${search_path}?${params}`).then(handleResponse<SearchResult[]>);
        },
    };
}

// ---------------------------------------------------------------------------
// Global (non-stream-scoped) API
// ---------------------------------------------------------------------------

export const guestApi = {
    getStreamState: async (): Promise<StreamState> => {
        const res = await fetch(`${STREAM_API_BASE}/guest`);
        if (!res.ok) return { active: false, identifier: null };
        return handleResponse<StreamState>(res);
    },
};