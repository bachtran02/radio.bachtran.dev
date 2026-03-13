import type { RefObject } from 'react';

export type PlayerEventType =
    | 'TRACK_STARTED'
    | 'TRACK_ENDED'
    | 'QUEUE_UPDATED'
    | 'QUEUE_SHUFFLED'
    | 'PAUSE_TOGGLED'
    | 'POSITION_SEEKED'
    | 'LOOP_MODE_CHANGED';

export interface TrackInfo {
    title: string;
    author: string;
    duration: number;
    identifier: string;
    isStream: boolean;
    uri: string;
    artworkUrl: string;
}

export interface PlaybackState {
    isPlaying: boolean;
    isPaused: boolean;
    position?: number;
    loop: string;
    track?: TrackInfo;
}

export interface PlayerUpdateEvent {
    eventType: PlayerEventType;
    state: PlaybackState;
    queue: TrackInfo[];
    history: TrackInfo[];
}

export const StreamStatus = {
    CHECKING: 'checking',
    NOT_FOUND: 'not-found',
    INACTIVE: 'inactive',
    READY: 'ready',
} as const;

export type StreamStatusValue = typeof StreamStatus[keyof typeof StreamStatus];

export interface PlayerContextValue {
    audioRef: RefObject<HTMLVideoElement | null>;
    volume: number;
    updateVolume: (val: number) => void;
    playerData: PlayerUpdateEvent | null;
    streamId: string | null;
    locked: boolean;
    loading: boolean;
    streamConnecting: boolean;
    setStreamConnecting: (val: boolean) => void;
}