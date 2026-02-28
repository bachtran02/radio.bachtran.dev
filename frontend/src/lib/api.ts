export const STREAM_API_BASE = '/api/stream';
export const PLAYER_API_BASE = '/api/player';
export const QUEUE_API_BASE = '/api/queue';
export const SEARCH_API_BASE = '/api/search';

export const LoopMode = {
    NONE: 'none',
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

export interface Track {
    title: string;
    author: string;
    length: number;
    uri: string;
    artworkUrl?: string;
    identifier: string;
    stream: boolean;
    isrc: string;
}

export interface PlaybackState {
    playing: boolean;
    paused: boolean;
    position: number;
    track: Track | null;
    loop: LoopMode;
}

export interface StreamState {
    active: boolean;
    identifier: string | null;
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`API Error: ${res.status} - ${errorText}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {} as T;
}

export const api = {
    search: async (query: string, source: string, types?: string): Promise<SearchResult[]> => {
        types = types || 'track';
        const params = new URLSearchParams({ query, source, types });
        const res = await fetch(`${SEARCH_API_BASE}?${params}`);
        return handleResponse<SearchResult[]>(res);
    },

    add: async(url: string, next: boolean = false, shuffle: boolean = false) => 
        fetch(`${PLAYER_API_BASE}/add`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, next, shuffle })
        }).then(handleResponse),

    play: async (url: string) => 
        fetch(`${PLAYER_API_BASE}/play`, { 
            method: 'POST', 
            body: url 
        }).then(handleResponse),

    removeFromQueue: (index: number) => 
        fetch(`${QUEUE_API_BASE}/${index}`, { method: 'DELETE' }).then(handleResponse),

    moveQueueItem: (fromIndex: number, toIndex: number, uri: string) =>
        fetch(`${QUEUE_API_BASE}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromIndex, to: toIndex, uri: uri })
        }).then(handleResponse),

    _command: (path: string) => fetch(`${PLAYER_API_BASE}/${path}`, { method: 'POST' }).then(handleResponse),

    skip: () => api._command('skip'),
    pause: () => api._command('pause'),
    resume: () => api._command('resume'),
    stop: () => api._command('stop'),
    
    setLoopMode: (mode: LoopMode) => api._command(`loop/${mode}`),
    shuffle: () => api._command('shuffle'),
    
    seek: (position: number) => 
        fetch(`${PLAYER_API_BASE}/seek`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: position.toString()
        }).then(handleResponse),

    getStreamState: async (): Promise<StreamState> => {
        const res = await fetch(`${STREAM_API_BASE}/guest`);
        
        if (!res.ok) {
            console.error('Failed to fetch stream state:', res.statusText);
            return { active: false, identifier: null };
        }
        return await handleResponse<StreamState>(res);
    },

    startStreamGuest: async (): Promise<void> => {
        const res = await fetch(`${STREAM_API_BASE}/start/guest`, {
            method: 'POST',
        });
        if (!res.ok) {
            const errorText = await res.text().catch(() => 'Unknown error');
            throw new Error(`Failed to start stream: ${res.status} - ${errorText}`);
        }
    }

    /* 
    getPlaybackState: async (): Promise<PlaybackState> => {
        const res = await fetch(`${PLAYER_API_BASE}/playback`);
        const state = await handleResponse<any>(res);
        return {
            ...state,
            loop: (state.loop?.toUpperCase() || 'NONE') as LoopMode
        };
    },
    */

    /*
    getQueue: async (): Promise<Track[]> => {
        const res = await fetch(QUEUE_API_BASE);
        return handleResponse<Track[]>(res);
    },

    getRecentlyPlayed: async (): Promise<Track[]> => {
        const res = await fetch(`${QUEUE_API_BASE}/history`);
        return handleResponse<Track[]>(res);
    }
    */
};