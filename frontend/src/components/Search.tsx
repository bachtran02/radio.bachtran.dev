import { useState } from 'react';
import { Radio, Search as SearchIcon } from 'lucide-react';
import { api } from '../api';
import type { SearchResult } from '../api';

type FilterType = 'track' | 'playlist' | 'album' | 'artist';

export function Search() {
    const [query, setQuery] = useState('');
    const [source, setSource] = useState('youtube');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [addingUri, setAddingUri] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('track');

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
            await api.add(uri);
        } catch (error) {
            alert('Failed to add track');
        } finally {
            setAddingUri(null);
        }
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

    return (
        <div className="search-container">
            <form onSubmit={handleSearch}>
                <select value={source} onChange={(e) => setSource(e.target.value)}>
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
                {(['track', 'playlist', 'album', 'artist'] as FilterType[]).map(filter => (
                    <button
                        key={filter}
                        type="button"
                        className={`filter-button ${selectedFilter === filter ? 'active' : ''}`}
                        onClick={() => selectFilter(filter)}
                        disabled={source !== 'spotify'}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {searchResults.length > 0 && (
                <div className="search-results">
                    {searchResults.map((result, i) => (
                        <button
                            key={i}
                            onClick={() => handleAddTrack(result.uri)}
                            disabled={addingUri === result.uri}
                            className="search-result-item"
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
                                        ? `${result.author} • ${formatDuration(result.duration)}`
                                        : result.numItems > 0 
                                            ? `${result.author} • ${result.numItems} items`
                                            : result.author
                                    }
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
