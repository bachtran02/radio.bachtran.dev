import { Radio, Search as SearchIcon, Music2, List, Disc3, User, MoreVertical, Play, Shuffle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../../lib/api';
import { displayDuration } from '../../../lib/utils';
import type { SearchResult } from '../../../lib/api';

type FilterType = 'track' | 'playlist' | 'album' | 'artist';

const filterConfig: Record<FilterType, { icon: React.ComponentType<{ size?: number }>, label: string }> = {
    track: { icon: Music2, label: 'Tracks' },
    playlist: { icon: List, label: 'Playlists' },
    album: { icon: Disc3, label: 'Albums' },
    artist: { icon: User, label: 'Artists' },
};

export function Search() {
    const [query, setQuery] = useState('');
    const [source, setSource] = useState('youtube');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [addingUri, setAddingUri] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('track');
    const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const handleClickOutside = () => {
            if (openMenuIndex !== null) {
                setOpenMenuIndex(null);
                setMenuPosition(null);
            }
        };

        if (openMenuIndex !== null) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuIndex]);

    const selectFilter = (filter: FilterType) => {
        setSelectedFilter(filter);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const results = await api.search(query, source, selectedFilter);
            setSearchResults(results);
            setQuery('');
        } catch (error) {
            alert('Search failed: ' + error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTrack = async (uri: string) => {
        setAddingUri(uri);
        try {
            await api.add(uri, false, false);
        } catch (error) {
            alert('Failed to add track');
        } finally {
            setAddingUri(null);
        }
    };

    const handleAddNext = async (e: React.MouseEvent, uri: string) => {
        e.stopPropagation();
        setOpenMenuIndex(null);
        setAddingUri(uri);
        try {
            await api.add(uri, true, false);
        } catch (error) {
            alert('Failed to add next');
        } finally {
            setAddingUri(null);
        }
    };

    const handleAddShuffle = async (e: React.MouseEvent, uri: string) => {
        e.stopPropagation();
        setOpenMenuIndex(null);
        setAddingUri(uri);
        try {
            await api.add(uri, false, true);
        } catch (error) {
            alert('Failed to add and shuffle');
        } finally {
            setAddingUri(null);
        }
    };

    const handleAddNextShuffle = async (e: React.MouseEvent, uri: string) => {
        e.stopPropagation();
        setOpenMenuIndex(null);
        setAddingUri(uri);
        try {
            await api.add(uri, true, true);
        } catch (error) {
            alert('Failed to add next and shuffle');
        } finally {
            setAddingUri(null);
        } 
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

    const handleItemClick = (uri: string) => {
        if (openMenuIndex === null) {
            handleAddTrack(uri);
        }
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch}>
                <select value={source} onChange={(e) => {
                    setSource(e.target.value);
                    setSelectedFilter('track');
                }}>
                    <option value="youtube">YouTube</option>
                    <option value="spotify">Spotify</option>
                    <option value="soundcloud">Soundcloud</option>
                </select>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                    {loading ? '...' : <SearchIcon size={14} />}
                </button>
            </form>

            <div className="search-filters">
                {(['track', 'playlist', 'album', 'artist'] as FilterType[]).map(filter => {
                    const { icon: Icon, label } = filterConfig[filter];
                    const isDisabled = source !== 'spotify';
                    return (
                        <button
                            key={filter}
                            type="button"
                            className={`filter-button ${selectedFilter === filter ? 'active' : ''}`}
                            onClick={() => selectFilter(filter)}
                            disabled={isDisabled}
                            title={isDisabled ? 'Only available for Spotify' : `Search ${label}`}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            {searchResults.length > 0 && (
                <div className="search-results">
                    {searchResults.map((result, i) => (
                        <div
                            key={i}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleItemClick(result.uri)}
                            onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && openMenuIndex === null) {
                                    e.preventDefault();
                                    handleItemClick(result.uri);
                                }
                            }}
                            className={`search-result-item ${addingUri === result.uri ? 'disabled' : ''}`}
                        >
                            {result.artworkUrl ? (
                                <img src={result.artworkUrl} alt="" />
                            ) : (
                                <div className="search-result-placeholder">
                                    <Radio size={16} />
                                </div>
                            )}
                            <div className="search-result-info">
                                <div className="search-result-title">{result.title}</div>
                                <div className="search-result-meta">
                                    {result.type === 'track' 
                                        ? `${result.author} • ${displayDuration(result.stream, result.duration)}`
                                        : `${result.author} • ${result.numItems} ${result.numItems < 2 ? 'item' : 'items'}`
                                    }
                                </div>
                            </div>
                            <button
                                className="context-menu-button"
                                onClick={(e) => handleMenuToggle(e, i)}
                                aria-label="More options"
                            >
                                <MoreVertical size={16} />
                            </button>
                            {openMenuIndex === i && menuPosition && createPortal(
                                <div className="context-menu" style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}>
                                    <button
                                        className="context-menu-item"
                                        onClick={(e) => handleAddNext(e, result.uri)}
                                    >
                                        <Play size={14} />
                                        <span>Add Next</span>
                                    </button>
                                    {result.type === 'playlist' && (
                                        <button
                                            className="context-menu-item"
                                            onClick={(e) => handleAddShuffle(e, result.uri)}
                                        >
                                            <Shuffle size={14} />
                                            <span>Add & Shuffle</span>
                                        </button>
                                    )}

                                    {result.type === 'playlist' && (
                                        <button
                                            className="context-menu-item"
                                            onClick={(e) => handleAddNextShuffle(e, result.uri)}
                                        >
                                            <Shuffle size={14} />
                                            <span>Add Next & Shuffle</span>
                                        </button>
                                    )}
                                </div>,
                                document.body
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
