import { useEffect, useRef } from 'react';

import Hls from 'hls.js';
import { usePlayer } from '@/context/PlayerContext';
import { config } from '@/config';

const MAX_RETRIES    = 10;
const BASE_DELAY_MS  = 2_000;
const MAX_DELAY_MS   = 30_000;

export function LiveAudioStream() {

    const { audioRef, locked, streamId } = usePlayer();
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (locked || !audio || !streamId) return;

        const hlsUrl = `${config.hlsBase}/${streamId}/index.m3u8`;

        if (Hls.isSupported()) {
            let hls = new Hls({ maxLiveSyncPlaybackRate: 1.5 });
            let destroyed = false;

            const clearRetryTimer = () => {
                if (retryTimerRef.current !== null) {
                    clearTimeout(retryTimerRef.current);
                    retryTimerRef.current = null;
                }
            };

            const retryDelay = () =>
                Math.min(BASE_DELAY_MS * 2 ** retryCountRef.current, MAX_DELAY_MS);

            const attach = () => {
                hls.attachMedia(audio);
            };

            const reconnect = () => {
                if (destroyed) return;
                if (retryCountRef.current >= MAX_RETRIES) {
                    console.error('HLS: max retries reached, giving up.');
                    return;
                }

                const delay = retryDelay();
                console.log(`HLS: reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);

                retryTimerRef.current = setTimeout(() => {
                    if (destroyed) return;
                    retryCountRef.current += 1;
                    hls.destroy();
                    hls = new Hls({ maxLiveSyncPlaybackRate: 1.5 });
                    bindEvents();
                    attach();
                }, delay);
            };

            const bindEvents = () => {
                hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                    hls.loadSource(hlsUrl);
                });

                hls.on(Hls.Events.MANIFEST_LOADED, () => {
                    retryCountRef.current = 0; // reset on successful load
                    audio.play().catch(() => {/* autoplay policy — ignore */});
                });

                audio.onplay = () => {
                    if (hls.liveSyncPosition !== null) {
                        audio.currentTime = hls.liveSyncPosition;
                    }
                };

                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (!data.fatal) return;

                    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        // Try the built-in media recovery once before a full reconnect
                        console.warn('HLS: fatal media error, attempting recovery.');
                        hls.recoverMediaError();
                    } else {
                        // Network error (e.g. stream not up yet) — reconnect with backoff
                        console.warn(`HLS: fatal error (${data.details}), scheduling reconnect.`);
                        reconnect();
                    }
                });
            };

            bindEvents();
            attach();

            return () => {
                destroyed = true;
                clearRetryTimer();
                hls.destroy();
            };

        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            /* Native HLS (Safari / iOS) — simple poll until the manifest appears */
            let cancelled = false;
            let attempt = 0;

            const tryLoad = () => {
                fetch(hlsUrl).then((res) => {
                    if (cancelled) return;
                    if (res.ok) {
                        audio.src = hlsUrl;
                        audio.play().catch(() => {});
                    } else if (attempt < MAX_RETRIES) {
                        const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
                        attempt++;
                        retryTimerRef.current = setTimeout(tryLoad, delay);
                    }
                }).catch(() => {
                    if (cancelled || attempt >= MAX_RETRIES) return;
                    const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
                    attempt++;
                    retryTimerRef.current = setTimeout(tryLoad, delay);
                });
            };

            tryLoad();
            return () => {
                cancelled = true;
                if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current);
            };

        } else {
            console.error('HLS not supported in this browser');
        }
    }, [locked, streamId]);

    if (locked) return null;

    return <video ref={audioRef} autoPlay muted playsInline style={{ display: 'none' }} />;
}