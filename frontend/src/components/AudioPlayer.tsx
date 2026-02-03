import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { api } from '../api';
import type { PlaybackState, Track } from '../api';
import { NowPlaying } from './NowPlaying';
import { Controls } from './Controls';
import { Search } from './Search';
import { Queue } from './Queue';
import './AudioPlayer.css';

const HLS_URL = 'http://localhost:8888/radio/index.m3u8';
const WEBRTC_URL = 'http://localhost:8889/radio/whep'; // WHEP endpoint

export function AudioPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [streamType, setStreamType] = useState<'hls' | 'webrtc'>('hls');
    const [isPlaying, setIsPlaying] = useState(false); // Local player state (muted/playing)
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

    // Stream Setup (HLS & WebRTC)
    useEffect(() => {
        if (!audioRef.current) return;
        const audioEl = audioRef.current;
        let hls: Hls | undefined;
        let pc: RTCPeerConnection | undefined;

        const cleanup = () => {
            if (hls) hls.destroy();
            if (pc) pc.close();
            if (audioEl) {
                audioEl.src = '';
                audioEl.srcObject = null;
            }
        };

        const setupHLS = () => {
            if (Hls.isSupported()) {
                hls = new Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(HLS_URL);
                hls.attachMedia(audioEl);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (isPlaying) audioEl.play().catch(console.error);
                });
            } else if (audioEl.canPlayType('application/vnd.apple.mpegurl')) {
                audioEl.src = HLS_URL;
            }
        };

        const setupWebRTC = async () => {
            pc = new RTCPeerConnection();
            pc.addTransceiver('audio', { direction: 'recvonly' });
            
            pc.ontrack = (event) => {
                const stream = event.streams[0];
                if (stream) {
                    audioEl.srcObject = stream;
                    if (isPlaying) audioEl.play().catch(console.error);
                }
            };

            try {
                const offer = await pc.createOffer();

                if (offer.sdp) {
                    // Reassign the modified string back to the offer object
                    offer.sdp = offer.sdp.replace(
                        /a=fmtp:111 .*/g,
                        (line) => `${line.trim()};stereo=1;sprop-stereo=1;maxaveragebitrate=128000;cbr=1`
                    );
                } else {
                    console.error("SDP is undefined. Check if the PeerConnection was initialized correctly.");
                }

                await pc.setLocalDescription(offer);

                const response = await fetch(WEBRTC_URL, {
                    method: 'POST',
                    body: offer.sdp,
                    headers: { 'Content-Type': 'application/sdp' } // Standard WHEP content type
                });

                if (response.status === 201 || response.ok) {
                    const answer = await response.text();
                    await pc.setRemoteDescription({ type: 'answer', sdp: answer });
                } else {
                    console.error("WHEP handshake failed", response.status);
                }
            } catch (err) {
                console.error("WebRTC Setup Error", err);
            }
        };

        cleanup(); // Cleanup previous stream before switching
        if (streamType === 'hls') {
            setupHLS();
        } else {
            setupWebRTC();
        }

        return cleanup;
    }, [streamType]); // Re-run when streamType changes

    // Controls for the remote bot
    const handleResume = () => api.resume();
    const handlePause = () => api.pause();
    const handleSkip = () => api.skip();
    const handleStop = () => api.stop();

    // Local audio toggle (listen/mute)
    const toggleListen = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <div className="audio-player">
            <div className="main-content">
                <div className="center-section">
                    <NowPlaying track={playbackState?.track || null} />

                    <Controls
                        isPaused={playbackState?.paused || false}
                        isPlaying={isPlaying}
                        streamType={streamType}
                        onStop={handleStop}
                        onPause={handlePause}
                        onResume={handleResume}
                        onSkip={handleSkip}
                        onToggleListen={toggleListen}
                        onStreamTypeChange={setStreamType}
                    />

                    <Queue tracks={queue} />
                </div>

                <div className="search-section">
                    <Search />
                </div>
            </div>

            <audio ref={audioRef} />
        </div>
    );
}
