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

import { usePlayer } from '../../../context/PlayerContext';
import { api, LoopMode } from '../../../lib/api';

export function Controls() {
    const { playerData, volume, updateVolume } = usePlayer();
    const [showVolume, setShowVolume] = useState(false);
    const [optimisticLoop, setOptimisticLoop] = useState<LoopMode | null>(null);

    const isPaused = playerData?.state?.isPaused;
    const curLoop = optimisticLoop ?? playerData?.state?.loop;

    return (
        <div className="controls">

            <button onClick={() => api.seek(0)} title="Restart">
                <RotateCcw size={16} />
            </button>

            {!isPaused ? (
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

            {curLoop === LoopMode.NONE ? (
                <button onClick={() => {
                    setOptimisticLoop(LoopMode.QUEUE);
                    api.setLoopMode(LoopMode.QUEUE)
                }} title="Loop: Off" style={{ opacity: 0.5 }}>
                    <Repeat size={16} />
                </button>
            ) : curLoop === LoopMode.QUEUE ? (
                <button onClick={() => {
                    setOptimisticLoop(LoopMode.TRACK);
                    api.setLoopMode(LoopMode.TRACK)
                }} title="Loop: Queue">
                    <Repeat size={16} />
                </button>
            ) : (
                <button onClick={() => {
                    setOptimisticLoop(LoopMode.NONE);
                    api.setLoopMode(LoopMode.NONE)
                }} title="Loop: Track">
                    <Repeat1 size={16} />
                </button>
            )}

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