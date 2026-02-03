import type { Track } from '../api';

interface QueueProps {
    tracks: Track[];
}

export function Queue({ tracks }: QueueProps) {
    return (
        <div className="queue-container">
            <h3>Queue ({tracks.length})</h3>
            <div className="queue-list">
                {tracks.map((track, i) => (
                    <div key={i} className="queue-item">
                        <span>{i + 1}</span>
                        {track.uri ? (
                            <a 
                                href={track.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="queue-item-title" 
                                title={track.title}
                            >
                                {track.title}
                            </a>
                        ) : (
                            <div className="queue-item-title" title={track.title}>{track.title}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
