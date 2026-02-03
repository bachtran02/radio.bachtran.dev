import type { Track } from '../api';

interface QueueProps {
    tracks: Track[];
}

export function Queue({ tracks }: QueueProps) {
    return (
        <div>
            <div>Queue ({tracks.length})</div>
            <div>
                {tracks.map((track, i) => (
                    <div key={i}>
                        <span>{i + 1}</span>
                        <div>{track.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
