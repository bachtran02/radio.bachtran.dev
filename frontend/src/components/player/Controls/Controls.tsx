import { 
  Pause, 
  Play, 
  Repeat, 
  Repeat1, 
  RotateCcw, 
  Shuffle, 
  SkipForward, 
  Square, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { useState } from 'react';

import { usePlayer } from '@/context/PlayerContext';
import { useStreamApi } from '@/hooks/useStreamApi';
import { LoopMode } from '@/lib/api';
import { InitialControls } from './InitialControls';

type LoopConfig = {
    nextMode: LoopMode;
    title: string;
    icon: React.ReactNode;
    className: string;
};

const LOOP_CONFIGS: Record<LoopMode, LoopConfig> = {
    [LoopMode.NONE]: { 
        nextMode: LoopMode.QUEUE, title: "Loop: Off", icon: <Repeat size={16} />, className: "loop-off" 
    },
    [LoopMode.QUEUE]: { 
        nextMode: LoopMode.TRACK, title: "Loop: Queue", icon: <Repeat size={16} />, className: "loop-queue" 
    },
    [LoopMode.TRACK]: { 
        nextMode: LoopMode.NONE, title: "Loop: Track", icon: <Repeat1 size={16} />, className: "loop-track" 
    },
};

export function Controls() {

    const { playerData, volume, updateVolume, locked, loading } = usePlayer();
    const api = useStreamApi();
    const [showVolume, setShowVolume] = useState(false);
    const [optimisticLoop, setOptimisticLoop] = useState<LoopMode | null>(null);

    if (loading) return <div className="loading">Checking stream status...</div>;
    if (locked) return <InitialControls />;

    const currentLoopMode = (playerData?.state?.loop ?? LoopMode.NONE) as LoopMode;
    const config = LOOP_CONFIGS[optimisticLoop ?? currentLoopMode];

    const handleToggleLoop = () => {
        const nextMode = config.nextMode;
        setOptimisticLoop(nextMode);
        api.setLoopMode(nextMode);
    };

    return (
        <div className="controls">

            <button onClick={() => api.seek(0)} title="Restart">
                <RotateCcw size={16} />
            </button>

            {!playerData?.state?.isPaused ? (
                <button onClick={() => api.pause()} title="Pause">
                    <Pause size={16} />
                </button>
            ) : (
                <button onClick={() => api.resume()} title="Play">
                    <Play size={16} />
                </button>
            )}

            <button onClick={() => api.skip()} title="Skip">
                <SkipForward size={16} />
            </button>

            <button onClick={() => api.stop()} title="Stop">
                <Square size={16} />
            </button>

            <button onClick={() => api.shuffle()} title="Shuffle queue">
                <Shuffle size={16} />
            </button>

            <button className={config.className} onClick={handleToggleLoop} title={config.title}>
                {config.icon}
            </button>

            <div className="volume-control">
                <button onClick={() => setShowVolume(!showVolume)} title="Volume">
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
                            onChange={(e) => updateVolume(parseFloat(e.target.value))}
                        />
                    </div>
                )}
            
            </div>
        </div>
    );
}