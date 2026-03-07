import { useState, useEffect, useRef } from 'react';

interface UseLocalProgressOptions {
    serverPosition: number | undefined;
    eventType: string | undefined;
    isPaused: boolean;
    isStream: boolean;
    duration: number;
}

const DRIFT_THRESHOLD_MS = 2000;

/**
 * Maintains a client-side playback timer that stays in sync with the
 * server position while avoiding excessive re-renders from raw subscription
 * ticks. Fixes the stale-closure bug in NowPlaying by tracking the current
 * progress value via a ref instead of reading it as an effect dependency.
 */
export function useLocalProgress({
    serverPosition,
    eventType,
    isPaused,
    isStream,
    duration,
}: UseLocalProgressOptions): [number, (position: number) => void] {
    const [localProgress, setLocalProgress] = useState(serverPosition ?? 0);
    const localProgressRef = useRef(localProgress);

    // Keep the ref current so the sync effect always reads the latest value
    // without needing localProgress in its dependency array.
    useEffect(() => {
        localProgressRef.current = localProgress;
    }, [localProgress]);

    // Sync with server position when a fresh event arrives.
    useEffect(() => {
        if (typeof serverPosition !== 'number') return;

        if (eventType === 'TRACK_STARTED') {
            setLocalProgress(0);
            return;
        }

        const drift = Math.abs(localProgressRef.current - serverPosition);
        if (drift > DRIFT_THRESHOLD_MS || serverPosition === 0) {
            setLocalProgress(serverPosition);
        }
    }, [serverPosition, eventType]);

    // Advance the local timer every second while playing.
    useEffect(() => {
        if (isPaused || isStream) return;

        const interval = setInterval(() => {
            setLocalProgress((prev) => {
                const next = prev + 1000;
                return next > duration ? duration : next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, isStream, duration]);

    return [localProgress, setLocalProgress];
}
