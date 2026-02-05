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
        const audio = audioRef.current;
        if (!audio) return;

        if (Hls.isSupported()) {
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
            fetch(HLS_URL)
                .then(() => {
                    audio.src = HLS_URL;
                    audio.play();
                });
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
            <div className="main-content">
                <div className="center-section">
                    <NowPlaying track={playbackState?.track || null} />

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
