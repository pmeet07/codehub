import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function PullRequestList({ repoId, onCreate, onSelect }) {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrs = async () => {
            try {
                const { data } = await api.get(`/pull-requests/repo/${repoId}`);
                setPrs(data);
            } catch (err) {
                console.error("Failed to fetch PRs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrs();
    }, [repoId]);

    if (loading) return <div className="text-gray-400">Loading Pull Requests...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Pull Requests</h2>
                <button
                    onClick={onCreate}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Pull Request
                </button>
            </div>

            {prs.length === 0 ? (
                <div className="bg-[#161b22] border border-github-border rounded-md p-8 text-center text-gray-400">
                    <p>No pull requests found.</p>
                </div>
            ) : (
                <div className="bg-[#161b22] border border-github-border rounded-md divide-y divide-[#21262d]">
                    {prs.map(pr => (
                        <div key={pr._id} className="p-4 hover:bg-[#0d1117] cursor-pointer" onClick={() => onSelect(pr._id)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-semibold text-lg hover:text-blue-400 mb-1">
                                        {pr.title}
                                    </h3>
                                    <div className="text-xs text-gray-400">
                                        #{pr.number} opened by <span className="text-white">{pr.author.username}</span> • {pr.status}
                                    </div>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${pr.status === 'open' ? 'bg-green-900 text-green-300 border-green-700' :
                                        pr.status === 'merged' ? 'bg-purple-900 text-purple-300 border-purple-700' :
                                            'bg-red-900 text-red-300 border-red-700'
                                        }`}>
                                        {pr.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
