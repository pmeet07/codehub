import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MagnifyingGlassIcon, BookOpenIcon, StarIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

export default function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [languageFilter, setLanguageFilter] = useState('');

    const searchRepos = async () => {
        setLoading(true);
        try {
            const params = { q: query };
            if (languageFilter) params.language = languageFilter;
            const { data } = await api.get('/search', { params });
            setResults(data);
        } catch (err) {
            console.error("Search failed", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-search when language filter changes
    useEffect(() => {
        searchRepos();
    }, [languageFilter]);

    // Initial load is handled by languageFilter init (if it triggers? No, usually effect runs once on mount).
    // If languageFilter starts as '', [languageFilter] effect runs on mount? Yes.
    // So distinct initial useEffect is not needed unless we want to avoid double searching if logic changes.
    // For now, this single effect covers mount + filter change.

    const handleSearch = (e) => {
        e.preventDefault();
        searchRepos();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 text-center text-white">
                <h1 className="text-4xl font-bold mb-4">Discover Repositories</h1>
                <p className="text-gray-400 mb-8">Search the whole CodeHub universe for code, users, and repositories.</p>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="w-full bg-[#161b22] border border-gray-600 rounded-md py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Search repositories..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-md font-bold hover:bg-green-700 transition">
                        Search
                    </button>
                </form>

                <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {['JavaScript', 'Python', 'Go', 'Java', 'TypeScript'].map(lang => (
                        <button
                            key={lang}
                            onClick={() => { setLanguageFilter(lang === languageFilter ? '' : lang); }}
                            className={`px-3 py-1 rounded-full text-sm border transition ${languageFilter === lang ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-400 hover:border-gray-400'}`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-700 pt-8">
                <h2 className="text-xl font-bold text-white mb-6">
                    {query ? `Search Results` : 'Trending Repositories'}
                </h2>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading...</div>
                ) : results.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No repositories found.</div>
                ) : (
                    <div className="grid gap-4">
                        {results.map(repo => (
                            <div key={repo._id} className="bg-[#161b22] border border-gray-700 rounded-md p-4 hover:border-gray-500 transition group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-800 rounded-md">
                                            <BookOpenIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                                        </div>
                                        <div>
                                            <Link to={`/${repo.owner.username}/${repo.name}`} className="text-blue-400 font-bold text-lg hover:underline">
                                                {repo.owner.username} / {repo.name}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs border border-gray-600 rounded-full px-2 py-0.5 text-gray-300">
                                                    {repo.isPrivate ? 'Private' : 'Public'}
                                                </span>
                                                <span className="text-sm text-gray-400">{repo.description || "No description provided."}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                                {repo.progLanguage || 'JavaScript'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <StarIcon className="w-4 h-4" />
                                                {repo.stars?.length || 0}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs">Updated {new Date(repo.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
