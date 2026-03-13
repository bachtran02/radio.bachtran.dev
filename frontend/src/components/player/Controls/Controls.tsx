import { 
  MonitorPause,
  MonitorPlay,
  Pause,
  Play,
  Plus,
  Repeat, 
  Repeat1, 
  RotateCcw, 
  Shuffle, 
  SkipForward, 
  Square, 
  User,
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/hooks/useAuth';
import { useContextMenu } from '@/hooks/useContextMenu';
import { useStreamApi } from '@/hooks/useStreamApi';
import { LoopMode } from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { ProfileMenu } from './ProfileMenu';

type LoopConfig = {
    nextMode: LoopMode;
    title: string;
    icon: React.ReactNode;
    className: string;
};

const LOOP_CONFIGS: Record<LoopMode, LoopConfig> = {
    [LoopMode.NONE]: { 
        nextMode: LoopMode.QUEUE, title: "Loop: Off", icon: <Repeat size={16} />, className: "" 
    },
    [LoopMode.QUEUE]: { 
        nextMode: LoopMode.TRACK, title: "Loop: Queue", icon: <Repeat size={16} />, className: "loop-active" 
    },
    [LoopMode.TRACK]: { 
        nextMode: LoopMode.NONE, title: "Loop: Track", icon: <Repeat1 size={16} />, className: "loop-active" 
    },
};

export function Controls() {

    const { audioRef, playerData, volume, updateVolume, locked, loading, streamConnecting } = usePlayer();
    const api = useStreamApi();
    const { user, login, logout } = useAuth();
    const [showVolume, setShowVolume] = useState(false);
    const [optimisticLoop, setOptimisticLoop] = useState<LoopMode | null>(null);
    const [starting, setStarting] = useState(false);
    const [, forceUpdate] = useState(0);
    const { openIndex: openMenuIndex, menuPosition, toggle: handleMenuToggle, close: closeMenu } = useContextMenu();

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const trigger = () => { forceUpdate(n => n + 1); };
        audio.addEventListener('pause', trigger);
        audio.addEventListener('play', trigger);
        return () => {
            audio.removeEventListener('pause', trigger);
            audio.removeEventListener('play', trigger);
        };
    }, [audioRef, audioRef.current]);

    if (loading) return <div className="loading">Checking stream status...</div>;
    if (streamConnecting) return <div className="loading">Connecting to stream...</div>;

    const audio = audioRef.current;
    const currentLoopMode = (playerData?.state?.loop ?? LoopMode.NONE) as LoopMode;
    const config = LOOP_CONFIGS[optimisticLoop ?? currentLoopMode];

    const handleToggleLoop = () => {
        const nextMode = config.nextMode;
        setOptimisticLoop(nextMode);
        api.setLoopMode(nextMode);
    };

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
        <div className={`controls${locked ? ' controls--initial' : ''}`}>

            <button disabled={locked} onClick={() => api.seek(0)} title="Restart">
                <RotateCcw size={16} />
            </button>

            {locked ? (
                <button onClick={handleStartStream} disabled={starting} title="Start stream">
                    <Plus size={16} />
                </button>
            ) : !playerData?.state?.isPaused ? (
                <button onClick={() => api.pause()} title="Pause stream">
                    <MonitorPause size={16} />
                </button>
            ) : (
                <button onClick={() => api.resume()} title="Resume stream">
                    <MonitorPlay size={16} />
                </button>
            )}

            <button
                disabled={locked}
                onClick={() => {
                    if (audio?.paused) {
                        audio?.play();
                    } else {
                        audio?.pause();
                    }
                }}
                title={audio?.paused ? 'Resume' : 'Pause'}
            >
                {audio?.paused ? <Play size={16} /> : <Pause size={16} />}
            </button>

            <button disabled={locked} onClick={() => api.skip()} title="Skip">
                <SkipForward size={16} />
            </button>

            <button disabled={locked} onClick={
              () => {
                audio?.pause();
                api.stop()
              }} title="Stop">
                <Square size={16} />
            </button>

            <button disabled={locked} onClick={() => api.shuffle()} title="Shuffle queue">
                <Shuffle size={16} />
            </button>

            <button disabled={locked} className={locked ? '' : config.className} onClick={locked ? undefined : handleToggleLoop} title={locked ? 'Loop' : config.title}>
                {locked ? <Repeat size={16} /> : config.icon}
            </button>

            <button
                onClick={(e) => handleMenuToggle(e, 0)}
                title={user ? `${user.name}` : 'Guest User'}
            >
                <User size={16} />
            </button>
            <ProfileMenu
                isOpen={openMenuIndex === 0 && !!menuPosition}
                menuPosition={menuPosition ?? { x: 0, y: 0 }}
                isLoggedIn={!!user}
                username={user?.name ?? 'Guest User'}
                onLogin={login}
                onLogout={logout}
                onClose={closeMenu}
            />

            <div className="volume-control">
                <button disabled={locked} onClick={() => setShowVolume(!showVolume)} title="Volume">
                    {!locked && volume !== 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
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