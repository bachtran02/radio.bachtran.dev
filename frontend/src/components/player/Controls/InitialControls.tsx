import { 
  Plus, 
  Repeat, 
  RotateCcw, 
  Shuffle, 
  SkipForward, 
  Square, 
  VolumeX,
} from 'lucide-react';

import { api } from '../../../lib/api';

export function InitialControls() {
    
    return (
        <div className="controls controls--initial">

            <button disabled title="Restart">
                <RotateCcw size={16} />
            </button>

            <button onClick={() => api.startStreamGuest()} title="Create stream">
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