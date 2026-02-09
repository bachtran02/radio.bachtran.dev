import { useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Square, Volume2, VolumeX, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { LoopMode } from '../api';

interface ControlsProps {
    isPaused: boolean;
    isPlaying: boolean;
    volume: number;
    loopMode: LoopMode;
    onStop: () => void;
    onPause: () => void;
    onResume: () => void;
    onSkip: () => void;
    onPrevious: () => void;
    onVolumeChange: (volume: number) => void;
    onLoopToggle: () => void;
    onShuffle: () => void;
}

export function Controls({
    isPaused,
    volume,
    loopMode,
    onStop,
    onPause,
    onResume,
    onSkip,
    onPrevious,
    onVolumeChange,
    onLoopToggle,
    onShuffle
}: ControlsProps) {
    const [showVolume, setShowVolume] = useState(false);

    return (
        <div className="controls">
            <button onClick={onPrevious} title="Restart track">
                <RotateCcw size={16} />
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
            <button onClick={onStop}>
                <Square size={16} />
            </button>
            <button onClick={onShuffle} title="Shuffle queue">
                <Shuffle size={16} />
            </button>
            <button onClick={onLoopToggle} title={loopMode === LoopMode.TRACK ? 'Loop: Track' : 'Loop: Off'}>
                {loopMode === LoopMode.TRACK ? <Repeat1 size={16} /> : <Repeat size={16} />}
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
        </div>
    );
}
