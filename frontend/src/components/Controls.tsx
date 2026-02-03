import { Play, Pause, SkipForward, Square, Volume2, VolumeX } from 'lucide-react';

interface ControlsProps {
    isPaused: boolean;
    isPlaying: boolean;
    streamType: 'hls' | 'webrtc';
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onToggleListen: () => void;
    onStreamTypeChange: (type: 'hls' | 'webrtc') => void;
}

export function Controls({
    isPaused,
    isPlaying,
    streamType,
    onStop,
    onPause,
    onResume,
    onSkip,
    onToggleListen,
    onStreamTypeChange
}: ControlsProps) {
    return (
        <div className="controls">
            <button onClick={onStop}>
                <Square size={16} />
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
            <button onClick={onToggleListen}>
                {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <select value={streamType} onChange={(e) => onStreamTypeChange(e.target.value as 'hls' | 'webrtc')}>
                <option value="hls">HLS</option>
                <option value="webrtc">WebRTC</option>
            </select>
        </div>
    );
}
