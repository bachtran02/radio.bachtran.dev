import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { api } from '../api';
import type { PlaybackState, Track } from '../api';
import { NowPlaying } from './NowPlaying';
import { Controls } from './Controls';
import { Search } from './Search';
import { Queue } from './Queue';
import './AudioPlayer.css';

const HLS_URL = '/mediamtx/radio/index.m3u8';
const WEBRTC_URL = '/mediamtx/radio/whep'; // WHEP endpoint

export function AudioPlayer() {
    const audioRef = useRef<HTMLVideoElement>(null);
    const [volume, setVolume] = useState(0);
    const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
    const [queue, setQueue] = useState<Track[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    // Remote state polling
    useEffect(() => {
        const fetchState = async () => {
            try {
                const state = await api.getPlaybackState();
                setPlaybackState(state);
                const q = await api.getQueue();
                setQueue(q);
            } catch (e) {
                console.error("Failed to fetch state", e);
            }
        };

        const interval = setInterval(fetchState, 1000);
        return () => clearInterval(interval);
    }, []);

    // Update document title with current track
    useEffect(() => {
        if (playbackState?.track?.title) {
            document.title = `${playbackState.track.title} - Radio Player`;
        } else {
            document.title = 'Radio Player';
        }
    }, [playbackState?.track?.title]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem('darkMode', isDarkMode.toString());
    }, [isDarkMode]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (Hls.isSupported()) {
            /* Fallback to Hls.js */
            const hls = new Hls({
                maxLiveSyncPlaybackRate: 1.5,
            });

            hls.on(Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                    hls.destroy();
                    console.log('Fatal HLS error occurred, reloading stream.');
                }
            });

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(HLS_URL);
            });

            hls.on(Hls.Events.MANIFEST_LOADED, () => {
                audio.play();
            });

            audio.onplay = () => {
                if (hls.liveSyncPosition !== null) {
                    audio.currentTime = hls.liveSyncPosition;
                }
            };

            hls.attachMedia(audio);
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            /* Utilize native HLS support on IOS devices */
            fetch(HLS_URL)
                .then(() => {
                    audio.src = HLS_URL;
                    audio.play();
                });
        } else {
            console.error('HLS not supported in this browser');
            alert('HLS not supported in this browser');
        }
    }, []);

    // Controls for the remote bot
    const handleResume = () => api.resume();
    const handlePause = () => api.pause();
    const handleSkip = () => api.skip();
    const handleStop = () => api.stop();
    const handlePrevious = () => {
        // Placeholder - backend doesn't support previous yet
        console.log('Previous button clicked (not implemented)');
    };

    const handleVolumeChange = (val: number) => {
        setVolume(val);
        if (audioRef.current) {
            audioRef.current.volume = val;
            audioRef.current.muted = val === 0;
        }
    };

    return (
        <div className="audio-player">
            <button 
                className="theme-toggle" 
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                    </svg>
                ) : (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                    </svg>
                )}
            </button>
            <div className="main-content">
                <div className="center-section">
                    <NowPlaying 
                        track={playbackState?.track || null} 
                        position={playbackState?.position || 0}
                        onSeek={(position) => api.seek(position)}
                    />

                    <Controls
                        isPaused={playbackState?.paused || false}
                        isPlaying={playbackState?.playing || false}
                        volume={volume}
                        onStop={handleStop}
                        onPause={handlePause}
                        onResume={handleResume}
                        onSkip={handleSkip}
                        onPrevious={handlePrevious}
                        onVolumeChange={handleVolumeChange}
                    />
                </div>

                <div className="search-section">
                    <Search />
                    <Queue tracks={queue} />
                </div>
            </div>

            <video ref={audioRef} autoPlay muted playsInline />
        </div>
    );
}
