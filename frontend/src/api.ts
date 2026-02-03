export const API_BASE = '/api/player';

export interface Track {
    title: string;
    author: string;
    identifier: string;
    stream: boolean;
    isrc: string;
    length: number;
    uri: string;
    artworkUrl?: string;
}

export interface PlaybackState {
    playing: boolean;
    paused: boolean;
    position: number
    track: Track | null;
}

export interface SearchResult {
    title: string;
    author: string;
    length: number;
    uri: string;
    artworkUrl?: string;
}

export const api = {
    add: async (url: string) => {
        const response = await fetch(`${API_BASE}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: url
        });
        if (!response.ok) throw new Error('Failed to add track');
        return response;
    },
    search: async (query: string, source: string): Promise<SearchResult[]> => {
        const params = new URLSearchParams({ query, source });
        const res = await fetch(`${API_BASE}/search?${params}`);
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Search failed: ${res.status} - ${errorText}`);
        }
        const text = await res.text();
        if (!text) {
            return [];
        }
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse search response:', text);
            throw new Error('Invalid response from search endpoint');
        }
    },
    skip: () => fetch(`${API_BASE}/skip`, { method: 'POST' }),
    pause: () => fetch(`${API_BASE}/pause`, { method: 'POST' }),
    resume: () => fetch(`${API_BASE}/resume`, { method: 'POST' }),
    stop: () => fetch(`${API_BASE}/stop`, { method: 'POST' }),
    getPlaybackState: async (): Promise<PlaybackState> => {
        const res = await fetch(`${API_BASE}/playback`);
        return res.json();
    },
    getQueue: async (): Promise<Track[]> => {
        const res = await fetch(`${API_BASE}/queue`);
        return res.json();
    }
};
