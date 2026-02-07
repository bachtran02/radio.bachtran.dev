import { useState } from 'react';
import type { Track } from '../api';
import { api } from '../api';
import { Radio } from 'lucide-react';

interface QueueProps {
    tracks: Track[];
    recentlyPlayed: Track[];
}

export function Queue({ tracks, recentlyPlayed }: QueueProps) {
    const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handlePlay = async (trackUri: string) => {
        try {
            await api.play(trackUri);
        } catch (error) {
            console.error('Failed to play track:', error);
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

        await api.moveQueueItem(draggedIndex, dropIndex, tracks[draggedIndex].uri);
        
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const formatDuration = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        const paddedSecs = secs.toString().padStart(2, '0');

        if (hours > 0) {
            const paddedMins = mins.toString().padStart(2, '0');
            return `${hours}:${paddedMins}:${paddedSecs}`;
        }

        return `${mins}:${paddedSecs}`;
    };

    const currentTracks = activeTab === 'queue' ? tracks : recentlyPlayed;
    const isQueueTab = activeTab === 'queue';

    return (
        <div className="queue-container">
            <div className="queue-tabs">
                <button 
                    className={`queue-tab ${activeTab === 'queue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queue')}
                >
                    Queue ({tracks.length})
                </button>
                <button 
                    className={`queue-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Recently Played ({recentlyPlayed.length})
                </button>
            </div>
            <div className="queue-list">
                {currentTracks.map((track, i) => (
                    <button 
                        key={i} 
                        className={`queue-item ${draggedIndex === i ? 'dragging' : ''} ${dragOverIndex === i && draggedIndex !== i ? 'drag-over' : ''}`}
                        draggable={isQueueTab}
                        onDragStart={isQueueTab ? (e) => handleDragStart(e, i) : undefined}
                        onDragOver={isQueueTab ? (e) => handleDragOver(e, i) : undefined}
                        onDragLeave={isQueueTab ? handleDragLeave : undefined}
                        onDrop={isQueueTab ? (e) => handleDrop(e, i) : undefined}
                        onDragEnd={isQueueTab ? handleDragEnd : undefined}
                        onClick={(_) => {
                            if (draggedIndex === null) {
                                handlePlay(track.uri);
                                if (isQueueTab) {
                                    removeQueuedItem(i);
                                }
                            }
                        }}
                    >
                        <span className="queue-item-index">{i + 1}</span>
                        {track.artworkUrl ? (
                            <img src={track.artworkUrl} alt="" draggable="false" />
                        ) : (
                            <div className="queue-item-placeholder">
                                <Radio size={16} />
                            </div>
                        )}
                        <div className="queue-item-info">
                            <div className="queue-item-title" title={track.title}>{track.title}</div>
                            <div className="queue-item-meta" title={`${track.author} • ${formatDuration(track.length)}`}>{track.author} • {formatDuration(track.length)}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
