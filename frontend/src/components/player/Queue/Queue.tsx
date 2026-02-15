import { Radio, MoreVertical, Play, Trash2, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePlayer } from '../../../context/PlayerContext';
import { api } from '../../../lib/api';
import { displayDuration } from '../../../lib/utils';
import type { TrackInfo } from '../../../types/player';

/* Fixed height for each queue/history item, used for virtual scrolling calculations */
const QUEUE_ITEM_HEIGHT = 76;       

export function Queue() {
    const { playerData } = usePlayer();

    const queue = playerData?.queue || [];
    const history = playerData?.history || [];

    const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const queueParentRef = useRef<HTMLDivElement>(null);
    const historyParentRef = useRef<HTMLDivElement>(null);

    const queueVirtualizer = useVirtualizer({
        count: queue.length,
        getScrollElement: () => queueParentRef.current,
        estimateSize: () => QUEUE_ITEM_HEIGHT,
        overscan: 5,
    });

    const historyVirtualizer = useVirtualizer({
        count: history.length,
        getScrollElement: () => historyParentRef.current,
        estimateSize: () => QUEUE_ITEM_HEIGHT,
        overscan: 5,
    });

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenMenuIndex(null);
            setMenuPosition(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handlePlay = async (trackUri: string) => {
        try {
            await api.play(trackUri);
        } catch (error) {
            console.error('Failed to play track:', error);
        }
    };

    const handleAddTrack = async (uri: string) => {
        try {
            await api.add(uri, false, false);
        } catch (error) {
            alert('Failed to add track');
        }
    };

    const removeQueuedItem = async (index: number) => {
        try {
            await api.removeFromQueue(index);
        } catch (error) {
            console.error('Failed to remove track from queue:', error);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        await api.moveQueueItem(draggedIndex, dropIndex, queue[draggedIndex].uri);
        
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleMenuToggle = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (openMenuIndex === index) {
            setOpenMenuIndex(null);
            setMenuPosition(null);
        } else {
            const button = e.currentTarget as HTMLElement;
            const rect = button.getBoundingClientRect();
            setMenuPosition({
                x: rect.right - 8,
                y: rect.top + rect.height / 2
            });
            setOpenMenuIndex(index);
        }
    };

    const handlePlayNext = async (e: React.MouseEvent, track: TrackInfo, index: number) => {
        e.stopPropagation();
        setOpenMenuIndex(null);
        try {
            if (isQueueTab) {
                await api.moveQueueItem(index, 0, track.uri);
            } else {
                await api.add(track.uri, true);
            }
        } catch (error) {
            console.error('Failed to play next:', error);
        }
    };

    const handleRemove = async (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setOpenMenuIndex(null);
        await removeQueuedItem(index);
    };

    const isQueueTab = activeTab === 'queue';
    const currentTracks = isQueueTab ? queue : history;
    const virtualizer = isQueueTab ? queueVirtualizer : historyVirtualizer;
    const parentRef = isQueueTab ? queueParentRef : historyParentRef;

    const renderTrackItem = (track: TrackInfo, index: number, virtualStart: number) => {
        return (
            <div 
                key={index}
                role="button"
                tabIndex={0}
                className={`queue-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index && draggedIndex !== index ? 'drag-over' : ''}`}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualStart}px)`,
                }}
                draggable={isQueueTab}
                onDragStart={isQueueTab ? (e) => handleDragStart(e, index) : undefined}
                onDragOver={isQueueTab ? (e) => handleDragOver(e, index) : undefined}
                onDragLeave={isQueueTab ? handleDragLeave : undefined}
                onDrop={isQueueTab ? (e) => handleDrop(e, index) : undefined}
                onDragEnd={isQueueTab ? handleDragEnd : undefined}
                onClick={(_) => {
                    if (draggedIndex === null && openMenuIndex === null) {
                        if (isQueueTab) {
                            handlePlay(track.uri);
                            removeQueuedItem(index);
                        } else {
                            handleAddTrack(track.uri)
                        }
                    }
                }}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && draggedIndex === null && openMenuIndex === null) {
                        e.preventDefault();
                        if (isQueueTab) {
                            handlePlay(track.uri);
                            removeQueuedItem(index);
                        } else {
                            handleAddTrack(track.uri)
                        }
                    }
                }}
            >
                <span className="queue-item-index">{index + 1}</span>
                {track.artworkUrl ? (
                    <img src={track.artworkUrl} alt="" draggable="false" />
                ) : (
                    <div className="queue-item-placeholder">
                        <Radio size={16} />
                    </div>
                )}
                <div className="queue-item-info">
                    <div className="queue-item-title" title={track.title}>{track.title}</div>
                    <div className="queue-item-meta" title={`${track.author} • ${displayDuration(track.isStream, track.duration)}`}>{track.author} • {displayDuration(track.isStream, track.duration)}</div>
                </div>
                <button
                    className="context-menu-button"
                    onClick={(e) => handleMenuToggle(e, index)}
                    aria-label="More options"
                >
                    <MoreVertical size={16} />
                </button>
                {openMenuIndex === index && menuPosition && createPortal(
                    <div className="context-menu" style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}>
                        <button
                            className="context-menu-item"
                            onClick={(e) => handlePlayNext(e, track, index)}
                        >
                            <Play size={14} />
                            <span>Play Next</span>
                        </button>
                        {isQueueTab ? (
                            <button
                                className="context-menu-item"
                                onClick={(e) => handleRemove(e, index)}
                            >
                                <Trash2 size={14} />
                                <span>Remove</span>
                            </button>
                        ) : (
                            <button
                                className="context-menu-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuIndex(null);
                                    handleAddTrack(track.uri);
                                }}
                            >
                                <Plus size={14} />
                                <span>Add to Queue</span>
                            </button>
                        )}
                    </div>,
                    document.body
                )}
            </div>
        );
    };

    return (
        <div className="queue-container">
            <div className="queue-tabs">
                <button 
                    className={`queue-tab ${activeTab === 'queue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queue')}
                >
                    Queue ({queue.length})
                </button>
                <button 
                    className={`queue-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Recently Played ({history.length})
                </button>
            </div>
            <div ref={parentRef} className="queue-list">
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const track = currentTracks[virtualItem.index];
                        return renderTrackItem(track, virtualItem.index, virtualItem.start);
                    })}
                </div>
            </div>
        </div>
    );
}
