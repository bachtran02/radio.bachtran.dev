import { Radio } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Track } from '../api';

interface NowPlayingProps {
    track: Track | null;
    position?: number;
    onSeek?: (position: number) => void;
}

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function NowPlaying({ track, position = 0, onSeek }: NowPlayingProps) {
    const titleRef = useRef<HTMLDivElement>(null);
    const titleTextRef = useRef<HTMLElement>(null);
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
                    {track?.uri ? (
                        <a 
                            href={track.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            ref={titleTextRef as React.RefObject<HTMLAnchorElement>}
                            className={`now-playing-title-text ${isOverflowing ? 'scrolling' : ''}`}
                            style={isOverflowing ? { '--container-width': `${containerWidth}px` } as React.CSSProperties : undefined}
                        >
                            {track.title}
                        </a>
                    ) : (
                        <span 
                            ref={titleTextRef as React.RefObject<HTMLSpanElement>}
                            className={`now-playing-title-text ${isOverflowing ? 'scrolling' : ''}`}
                            style={isOverflowing ? { '--container-width': `${containerWidth}px` } as React.CSSProperties : undefined}
                        >
                            {track?.title || "..."}
                        </span>
                    )}
                </div>
                <div className="now-playing-artist">{track?.author || "..."}</div>
                
                {track && (
                    <div className="now-playing-progress-container">
                        <span className="now-playing-time">{formatTime(position)}</span>
                        <div 
                            className="now-playing-progress"
                            onClick={(e) => {
                                if (!onSeek || !track.length) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const percentage = clickX / rect.width;
                                const newPosition = Math.floor(percentage * track.length);
                                onSeek(Math.max(0, Math.min(track.length, newPosition)));
                            }}
                            style={{ cursor: onSeek ? 'pointer' : 'default' }}
                        >
                            <div 
                                className="now-playing-progress-bar"
                                style={{ 
                                    width: track.length 
                                        ? `${Math.min(100, (position / track.length) * 100)}%` 
                                        : '0%' 
                                }}
                            />
                        </div>
                        <span className="now-playing-time">{formatTime(track.length || 0)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
