import { Radio } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useLocalProgress } from '@/hooks/useLocalProgress';
import { useStreamApi } from '@/hooks/useStreamApi';
import { displayDuration } from '@/lib/utils';
export function NowPlaying() {

    const { playerData } = usePlayer();
    const api = useStreamApi();

    const track = playerData?.state?.track;
    const isPaused = playerData?.state?.isPaused ?? true;
    const duration = track?.duration || 0;
    const isStream = track?.isStream || false;

    const serverPosition = playerData?.state?.position;
    const [localProgress, setLocalProgress] = useLocalProgress({
        serverPosition,
        eventType: playerData?.eventType,
        isPaused,
        isStream,
        duration,
    });


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
                        <span 
                            className="now-playing-time" 
                            style={{ visibility: isStream ? 'hidden' : 'visible' }}
                        >
                            {displayDuration(false, localProgress)}
                        </span>
                        <div 
                            className={`now-playing-progress`}
                            onClick={(e) => {
                                if (isStream || !duration) return;

                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = e.clientX - rect.left;
                                const percentage = clickX / rect.width;
                                const newPosition = Math.floor(percentage * duration);
                                
                                setLocalProgress(newPosition);
                                api.seek(newPosition);
                            }}
                            style={{ cursor: 'pointer' }}
                        >

                            <div 
                                className={`now-playing-progress-bar`}
                                style={{ 
                                    width: isStream ? '100%' : `${Math.min(100, (localProgress / duration) * 100)}%` 
                                }}
                            />
                        </div>
                        <span className="now-playing-time">{displayDuration(isStream, track.duration || 0)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
