export const PLAYER_API_BASE = '/api/player';
export const QUEUE_API_BASE = '/api/queue';
export const SEARCH_API_BASE = '/api/search';

export interface SearchResultTrack {
    type: 'track';
    title: string;
    author: string;
    artworkUrl: string;
    uri: string;
    duration: number;
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

    add: async(url: string) => 
        fetch(`${PLAYER_API_BASE}/add`, { 
            method: 'POST', 
            body: url 
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
    
    seek: (position: number) => 
        fetch(`${PLAYER_API_BASE}/seek`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: position.toString()
        }).then(handleResponse),

    getPlaybackState: async (): Promise<PlaybackState> => {
        const res = await fetch(`${PLAYER_API_BASE}/playback`);
        return handleResponse<PlaybackState>(res);
    },

    getQueue: async (): Promise<Track[]> => {
        const res = await fetch(QUEUE_API_BASE);
        return handleResponse<Track[]>(res);
    },

    getRecentlyPlayed: async (): Promise<Track[]> => {
        const res = await fetch(`${QUEUE_API_BASE}/history`);
        return handleResponse<Track[]>(res);
    }
};