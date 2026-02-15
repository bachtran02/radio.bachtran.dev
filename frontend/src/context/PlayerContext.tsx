import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react/compiled';
import { PLAYER_UPDATES_SUBSCRIPTION, GET_INITIAL_STATE } from '../lib/graphql';

import type { PlayerUpdateEvent } from '../types/player';

const PlayerContext = createContext<any>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {

    const audioRef = useRef<HTMLVideoElement>(null);
    const [volume, setVolumeState] = useState(0);
    const [playerData, setPlayerData] = useState<PlayerUpdateEvent | null>(null);

    const { data: queryData, loading: queryLoading } = useQuery<{ getInitialState: PlayerUpdateEvent }>(GET_INITIAL_STATE);

    const { data: subData } = useSubscription<{ playerUpdates: PlayerUpdateEvent }>(PLAYER_UPDATES_SUBSCRIPTION);

    useEffect(() => {
        if (queryData?.getInitialState) {
            setPlayerData(queryData.getInitialState);
        }
    }, [queryData]);

    useEffect(() => {
        const newEvent = subData?.playerUpdates;
        if (!newEvent) return;

        setPlayerData((prev: PlayerUpdateEvent | null) => {
            if (!prev) return newEvent;

            const { eventType } = newEvent;

            if (eventType === "QUEUE_UPDATED" || eventType === "QUEUE_SHUFFLED") {
                /* Only update Queue */
                return {
                    ...prev,
                    queue: newEvent.queue,
                    eventType: newEvent.eventType,
                    state: {
                        ...prev.state,
                        position: undefined,
                    }
                };
            }

            if (
                eventType === "PAUSE_TOGGLED" || 
                eventType === "POSITION_SEEKED" || 
                eventType === "LOOP_MODE_CHANGED"
            ) {
                /* Only update PlaybackState */
                return {
                    ...prev,
                    eventType: newEvent.eventType,
                    state: {
                        ...prev.state,
                        ...newEvent.state
                    }
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

    useEffect(() => {
        const track = playerData?.state?.track;
        if (track) {
            document.title = `${track.title} | ${track.author}`;
        } else {
            document.title = 'Bach\'s Personal Radio';
        }
    }, [playerData?.state?.track]);

    const value = {
        audioRef,
        volume,
        updateVolume,
        playerData,
        loading: queryLoading && !playerData
    };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => useContext(PlayerContext);