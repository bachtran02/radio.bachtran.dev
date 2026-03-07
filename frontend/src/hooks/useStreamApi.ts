import { useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { createStreamApi } from '@/lib/api';
import type { StreamApi } from '@/lib/api';

export type { StreamApi };

/**
 * Returns a stream-scoped API client already bound to the current streamId.
 * Re-memoized only when streamId changes.
 */
export function useStreamApi(): StreamApi {
    const { streamId } = usePlayer();
    return useMemo(() => createStreamApi(streamId ?? ''), [streamId]);
}
