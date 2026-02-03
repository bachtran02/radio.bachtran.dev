import { Radio } from 'lucide-react';
import type { Track } from '../api';

interface NowPlayingProps {
    track: Track | null;
}

export function NowPlaying({ track }: NowPlayingProps) {
    return (
        <div className="now-playing">
            {track?.artworkUrl ? (
                <img 
                    src={track.artworkUrl} 
                    alt="Album artwork"
                />
            ) : (
                <div>
                    <Radio size={24} />
                </div>
            )}
            <div>
                <div>Now Playing</div>
                <div>{track?.title || "..."}</div>
                <div>{track?.author || "..."}</div>
            </div>
        </div>
    );
}
