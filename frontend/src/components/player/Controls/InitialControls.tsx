import { 
  Plus, 
  Repeat, 
  RotateCcw, 
  Shuffle, 
  SkipForward, 
  Square, 
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';

import { useStreamApi } from '@/hooks/useStreamApi';
import { handleApiError } from '@/lib/errors';

export function InitialControls() {
    const api = useStreamApi();
    const [starting, setStarting] = useState(false);

    const handleStartStream = async () => {
        setStarting(true);
        try {
            await api.startStream();
            window.location.reload();
        } catch (err) {
            handleApiError(err, 'Failed to start stream');
            setStarting(false);
        }
    };
    
    return (
        <div className="controls controls--initial">

            <button disabled title="Restart">
                <RotateCcw size={16} />
            </button>

            <button onClick={handleStartStream} disabled={starting} title="Create stream">
                <Plus size={16} />
            </button>

            <button disabled title="Skip">
                <SkipForward size={16} />
            </button>

            <button disabled title="Stop">
                <Square size={16} />
            </button>

            <button disabled title="Shuffle">
                <Shuffle size={16} />
            </button>

            <button disabled title="Loop">
                <Repeat size={16} />
            </button>

            <button disabled title="Volume">
                <VolumeX size={16} />
            </button>
        </div>
    );
}