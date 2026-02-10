import { useEffect } from 'react';

import Hls from 'hls.js';
import { usePlayer } from '../../context/PlayerContext';

// const HLS_URL = '/mediamtx/radio/index.m3u8';
const HLS_URL = 'http://localhost:8888/radio/index.m3u8';

export function LiveAudioStream() {

    const { audioRef } = usePlayer();

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

            return () => {
                hls.destroy();
            };

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

    return <video ref={audioRef} autoPlay muted playsInline />
}