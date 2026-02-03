import { useState } from 'react';
import { Radio, Search as SearchIcon } from 'lucide-react';
import { api } from '../api';
import type { SearchResult } from '../api';

export function Search() {
    const [query, setQuery] = useState('');
    const [source, setSource] = useState('youtube');
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [addingUri, setAddingUri] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const results = await api.search(query, source);
            console.log('Search results:', results);
            setSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
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
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="search-container">
            <h3>Search</h3>
            <form onSubmit={handleSearch}>
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                    <option value="youtube">YouTube</option>
                    <option value="spotify">Spotify</option>
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
                                <div className="search-result-meta">{result.author} • {formatDuration(result.length)}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
