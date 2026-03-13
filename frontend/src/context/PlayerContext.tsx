import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react/compiled';
import { PLAYER_UPDATES_SUBSCRIPTION, GET_INITIAL_STATE } from '@/lib/graphql';
import type { PlayerUpdateEvent, PlayerContextValue, StreamStatusValue } from '@/types/player';
import { StreamStatus } from '@/types/player';

const PlayerContext = createContext<PlayerContextValue | null>(null);

interface PlayerProviderProps {
    children: React.ReactNode;
    streamStatus: StreamStatusValue;
    streamId: string | null;
}

export function PlayerProvider({ children, streamStatus, streamId }: PlayerProviderProps) {
    const audioRef = useRef<HTMLVideoElement>(null);
    const [volume, setVolumeState] = useState(0);
    const [playerData, setPlayerData] = useState<PlayerUpdateEvent | null>(null);
    const [streamConnecting, setStreamConnecting] = useState(false);

    const isReady = streamStatus === StreamStatus.READY;

    const { data: queryData, loading: queryLoading } = useQuery<{ getInitialState: PlayerUpdateEvent }>(
        GET_INITIAL_STATE,
        {
            variables: { streamId },
            skip: !isReady,
        }
    );

    const { data: subData } = useSubscription<{ playerUpdates: PlayerUpdateEvent }>(
        PLAYER_UPDATES_SUBSCRIPTION,
        {
            variables: { streamId },
            skip: !isReady,
        }
    );

    useEffect(() => {
        if (queryData?.getInitialState) {
            setPlayerData(queryData.getInitialState);
        }
    }, [queryData]);

    useEffect(() => {
        const newEvent = subData?.playerUpdates;
        if (!newEvent) return;

        setPlayerData((prev) => {
            if (!prev) return newEvent;

            const { eventType } = newEvent;

            if (eventType === 'QUEUE_UPDATED' || eventType === 'QUEUE_SHUFFLED') {
                return {
                    ...prev,
                    queue: newEvent.queue,
                    eventType: newEvent.eventType,
                    state: { ...prev.state, position: undefined },
                };
            }

            if (
                eventType === 'PAUSE_TOGGLED' ||
                eventType === 'POSITION_SEEKED' ||
                eventType === 'LOOP_MODE_CHANGED'
            ) {
                return {
                    ...prev,
                    eventType: newEvent.eventType,
                    state: { ...prev.state, ...newEvent.state },
                };
            }

            return newEvent;
        });
    }, [subData]);

    const updateVolume = (val: number) => {
        setVolumeState(val);
        if (audioRef.current) {
            audioRef.current.volume = val;
            audioRef.current.muted = val === 0;
        }
    };

    /* Sync browser tab title with the currently playing track */
    useEffect(() => {
        const track = playerData?.state?.track;
        document.title = track
            ? `${track.title} | ${track.author}`
            : "Bach Radio";
    }, [playerData?.state?.track]);

    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

        const track = playerData?.state?.track;
        if (!track) {
            navigator.mediaSession.metadata = null;
            return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.author,
            artwork: track.artworkUrl
                ? [
                    { src: track.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
                    { src: track.artworkUrl, sizes: '128x128', type: 'image/jpeg' },
                    { src: track.artworkUrl, sizes: '192x192', type: 'image/jpeg' },
                    { src: track.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
                    { src: track.artworkUrl, sizes: '384x384', type: 'image/jpeg' },
                    { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
                ]
                : [],
        });
    }, [playerData?.state?.track]);

    const value: PlayerContextValue = {
        audioRef,
        volume,
        updateVolume,
        playerData,
        streamId,
        locked: !isReady,
        loading: (queryLoading || streamStatus === StreamStatus.CHECKING) && !playerData,
        streamConnecting,
        setStreamConnecting,
    };

    return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = (): PlayerContextValue => {
    const ctx = useContext(PlayerContext);
    if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
    return ctx;
};