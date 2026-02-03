import { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Square, Volume2, VolumeX } from 'lucide-react';

interface ControlsProps {
    isPaused: boolean;
    isPlaying: boolean;
    streamType: 'hls' | 'webrtc';
    volume: number;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onPrevious: () => void;
    onToggleListen: () => void;
    onStreamTypeChange: (type: 'hls' | 'webrtc') => void;
    onVolumeChange: (volume: number) => void;
}

export function Controls({
    isPaused,
    isPlaying,
    streamType,
    volume,
    onStop,
    onPause,
    onResume,
    onSkip,
    onPrevious,
    onToggleListen,
    onStreamTypeChange,
    onVolumeChange
}: ControlsProps) {
    const [showVolume, setShowVolume] = useState(false);

    return (
        <div className="controls">
            <button onClick={onStop}>
                <Square size={16} />
            </button>
            <button onClick={onPrevious}>
                <SkipBack size={16} />
            </button>
            {!isPaused ? (
                <button onClick={onPause}>
                    <Pause size={16} />
                </button>
            ) : (
                <button onClick={onResume}>
                    <Play size={16} />
                </button>
            )}
            <button onClick={onSkip}>
                <SkipForward size={16} />
            </button>
            <div className="volume-control">
                <button onClick={() => setShowVolume(!showVolume)}>
                    {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                {showVolume && (
                    <div className="volume-slider">
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.01" 
                            value={volume} 
                            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        />
                    </div>
                )}
            </div>
            <button onClick={onToggleListen}>
                {isPlaying ? 'Mute' : 'Listen'}
            </button>
            <select value={streamType} onChange={(e) => onStreamTypeChange(e.target.value as 'hls' | 'webrtc')}>
                <option value="hls">HLS</option>
                <option value="webrtc">WebRTC</option>
            </select>
        </div>
    );
}
