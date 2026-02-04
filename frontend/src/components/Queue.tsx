import type { Track } from '../api';
import { api } from '../api';
import { Radio } from 'lucide-react';

interface QueueProps {
    tracks: Track[];
}

export function Queue({ tracks }: QueueProps) {

    const handlePlay = async (trackUri: string) => {
        try {
            await api.play(trackUri);
        } catch (error) {
            console.error('Failed to play track:', error);
        }
    };

    const removeQueuedItem = async (index: number) => {
        try {
            await api.removeFromQueue(index);
        } catch (error) {
            console.error('Failed to remove track from queue:', error);
        }
    }

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const paddedSecs = secs.toString().padStart(2, '0');

        if (hours > 0) {
            const paddedMins = mins.toString().padStart(2, '0');
            return `${hours}:${paddedMins}:${paddedSecs}`;
        }

        return `${mins}:${paddedSecs}`;
    };

    return (
        <div className="queue-container">
            <h3>Queue ({tracks.length})</h3>
            <div className="queue-list">
                {tracks.map((track, i) => (
                    <div 
                        key={i} 
                        className="queue-item"
                        onClick={() => {
                            handlePlay(track.uri);
                            removeQueuedItem(i);
                        }}
                    >
                        <span className="queue-item-index">{i + 1}</span>
                        {track.artworkUrl ? (
                            <img src={track.artworkUrl} alt="" />
                        ) : (
                            <div className="queue-item-placeholder">
                                <Radio size={16} />
                            </div>
                        )}
                        <div className="queue-item-info">
                            <div className="queue-item-title" title={track.title}>{track.title}</div>
                            <div className="queue-item-meta" title={`${track.author} • ${formatDuration(track.length)}`}>{track.author} • {formatDuration(track.length)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
