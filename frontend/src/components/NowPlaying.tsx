import { Radio } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Track } from '../api';

interface NowPlayingProps {
    track: Track | null;
}

export function NowPlaying({ track }: NowPlayingProps) {
    const titleRef = useRef<HTMLDivElement>(null);
    const titleTextRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const checkOverflow = () => {
            if (!titleRef.current || !titleTextRef.current) return;
            
            const containerWidth = titleRef.current.offsetWidth;
            const textWidth = titleTextRef.current.scrollWidth;
            
            setIsOverflowing(textWidth > containerWidth);
            setContainerWidth(containerWidth);
        };

        const timeoutId = setTimeout(checkOverflow, 100);
        
        window.addEventListener('resize', checkOverflow);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', checkOverflow);
        };
    }, [track?.title]);

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
            <div className="now-playing-info">
                <div className="now-playing-label">Now Playing</div>
                <div className="now-playing-title" ref={titleRef}>
                    <span 
                        ref={titleTextRef}
                        className={`now-playing-title-text ${isOverflowing ? 'scrolling' : ''}`}
                        style={isOverflowing ? { '--container-width': `${containerWidth}px` } as React.CSSProperties : undefined}
                        title={track?.title || "..."}
                    >
                        {track?.title || "..."}
                    </span>
                </div>
                <div className="now-playing-artist">{track?.author || "..."}</div>
            </div>
        </div>
    );
}
