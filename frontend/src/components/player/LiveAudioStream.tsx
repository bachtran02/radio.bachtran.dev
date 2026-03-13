import { useEffect, useRef } from 'react';

import Hls from 'hls.js';
import { usePlayer } from '@/context/PlayerContext';
import { config } from '@/config';

const MAX_RETRIES    = 10;
const FAST_RETRIES   = 5;
const FAST_DELAY_MS  = 1000;
const BASE_DELAY_MS  = 2_000;
const MAX_DELAY_MS   = 30_000;

const MSG_NATIVE_PAUSED_RETRY = 'Native HLS paused shortly after play; retrying.';
const MSG_HLS_UNSUPPORTED = 'HLS not supported in this browser';
const MSG_HLS_MEDIA_ERROR_RECOVERY = 'HLS: fatal media error, attempting recovery.';
const MSG_HLS_AUTOPLAY_BLOCKED = 'hls.js autoplay blocked by browser policy. User interaction is required.';
const MSG_HLS_PLAY_FAILED = 'hls.js play failed';

const msgLoadRetry = (status: number) => `Failed to load HLS stream (status ${status}), retrying...`;
const msgLoadGiveUp = (attempts: number, status: number) =>
    `Failed to load HLS stream after ${attempts} attempts (status ${status}), giving up.`;
const msgLoadAttemptFailed = (attempt: number, maxRetries: number) =>
    `Failed to load HLS stream (attempt ${attempt}/${maxRetries})`;
const msgLoadGiveUpNoStatus = (attempts: number) =>
    `Failed to load HLS stream after ${attempts} attempts, giving up.`;
const msgFatalReconnect = (details: string) => `HLS: fatal error (${details}), scheduling reconnect.`;

function getRetryDelayMs(retryIndex: number): number {
    if (retryIndex < FAST_RETRIES) return FAST_DELAY_MS;
    return Math.min(BASE_DELAY_MS * 2 ** (retryIndex - FAST_RETRIES), MAX_DELAY_MS);
}

export function LiveAudioStream() {

    const { audioRef, locked, streamId, setStreamConnecting } = usePlayer();
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (locked || !audio || !streamId) {
            setStreamConnecting(false);
            return;
        }
        retryCountRef.current = 0;

        const hlsUrl = `${config.hlsBase}/mediamtx/${streamId}/index.m3u8`;

        if (audio.canPlayType('application/vnd.apple.mpegurl')) {
            /* Use browser's native HLS support */
            setStreamConnecting(true);

            let cancelled = false;
            let playCheckTimer: ReturnType<typeof setTimeout> | null = null;

            const clearPlayCheckTimer = () => {
                if (playCheckTimer !== null) {
                    clearTimeout(playCheckTimer);
                    playCheckTimer = null;
                }
            };

            const scheduleRetry = () => {
                if (cancelled || retryCountRef.current >= MAX_RETRIES) return;
                clearPlayCheckTimer();
                const delay = getRetryDelayMs(retryCountRef.current);
                retryCountRef.current += 1;
                retryTimerRef.current = setTimeout(tryLoad, delay);
            };

            const tryLoad = () => {
                fetch(hlsUrl).then((res) => {
                    if (cancelled) return;
                    if (res.ok) {
                        audio.src = hlsUrl;
                        audio.playbackRate = 1.1;
                        audio.load();
                        audio.play().then(() => {
                            clearPlayCheckTimer();
                            playCheckTimer = setTimeout(() => {
                                if (cancelled) return;
                                if (audio.paused) {
                                    console.warn(MSG_NATIVE_PAUSED_RETRY);
                                    scheduleRetry();
                                } else {
                                    setStreamConnecting(false);
                                }
                            }, 100);
                        }).catch(() => {
                            scheduleRetry();
                        });
                    } else if (retryCountRef.current < MAX_RETRIES) {
                        console.warn(msgLoadRetry(res.status));
                        scheduleRetry();
                    } else {
                        console.error(msgLoadGiveUp(retryCountRef.current, res.status));
                    }
                }).catch(() => {
                    console.error(msgLoadAttemptFailed(retryCountRef.current + 1, MAX_RETRIES));
                    scheduleRetry();
                });
            };

            tryLoad();

            return () => {
                cancelled = true;
                if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current);
                clearPlayCheckTimer();
                setStreamConnecting(false);
            };
        } else if (Hls.isSupported()) {
            setStreamConnecting(false);
            let hls = new Hls({ maxLiveSyncPlaybackRate: 1.5 });
            let destroyed = false;

            const clearRetryTimer = () => {
                if (retryTimerRef.current !== null) {
                    clearTimeout(retryTimerRef.current);
                    retryTimerRef.current = null;
                }
            };

            const attach = () => {
                hls.attachMedia(audio);
            };

            const reconnect = () => {
                if (destroyed) return;
                if (retryCountRef.current >= MAX_RETRIES) {
                    console.error(msgLoadGiveUpNoStatus(retryCountRef.current));
                    return;
                }

                const delay = getRetryDelayMs(retryCountRef.current);
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
                    audio.play().catch((error) => {
                        const err = error as Error;
                        if (err?.name === 'NotAllowedError') {
                            console.warn(MSG_HLS_AUTOPLAY_BLOCKED);
                            return;
                        }
                        console.warn(MSG_HLS_PLAY_FAILED, error);
                    });
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
                        console.warn(MSG_HLS_MEDIA_ERROR_RECOVERY);
                        hls.recoverMediaError();
                    } else {
                        // Network error (e.g. stream not up yet) — reconnect with backoff
                        console.warn(msgFatalReconnect(data.details));
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

        } else {
            setStreamConnecting(false);
            console.error(MSG_HLS_UNSUPPORTED);
            return;
        }
    }, [locked, streamId, setStreamConnecting]);

    if (locked) return null;

    return <video ref={audioRef} autoPlay muted playsInline style={{ display: 'none' }} />;
}