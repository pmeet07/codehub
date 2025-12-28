import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PullRequestDetail({ prId, onBack }) {
    const [pr, setPr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);

    useEffect(() => {
        const fetchPr = async () => {
            try {
                const { data } = await api.get(`/pull-requests/${prId}`);
                setPr(data);
            } catch (err) {
                console.error("Failed to fetch PR", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPr();
    }, [prId]);

    const handleMerge = async () => {
        if (!window.confirm("Are you sure you want to merge this pull request?")) return;
        setMerging(true);
        try {
            const { data } = await api.post(`/pull-requests/${prId}/merge`);
            setPr({ ...pr, status: 'merged' });
            alert("Pull request merged successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Merge failed");
        } finally {
            setMerging(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!pr) return <div>PR not found</div>;

    return (
        <div className="bg-[#161b22] border border-github-border rounded-md">
            {/* Header */}
            <div className="p-4 border-b border-github-border">
                <button onClick={onBack} className="text-blue-400 text-sm hover:underline mb-2">← Back to PRs</button>
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {pr.title} <span className="text-gray-500 font-light">#{pr.number}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border text-white ${pr.status === 'open' ? 'bg-green-600 border-green-500' :
                        pr.status === 'merged' ? 'bg-purple-600 border-purple-500' :
                            'bg-red-600 border-red-500'
                        }`}>
                        {pr.status}
                    </span>
                    <span className="text-gray-400 text-sm">
                        <span className="font-bold text-white">{pr.author.username}</span> wants to merge into <code className="bg-gray-800 px-1 rounded">{pr.targetBranch}</code> from <code className="bg-gray-800 px-1 rounded">{pr.sourceBranch}</code>
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                <div className="prose prose-invert max-w-none mb-8">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{pr.description || "No description provided."}</p>
                </div>

                {/* Merge Box */}
                {pr.status === 'open' && (
                    <div className="border border-github-border rounded-md bg-[#0d1117] p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">This branch has no conflicts with the base branch</h4>
                                    <p className="text-xs text-gray-400">Merging can be performed automatically.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleMerge}
                                disabled={merging}
                                className="bg-green-600 text-white font-bold py-1.5 px-4 rounded-md text-sm hover:bg-green-500 disabled:opacity-50"
                            >
                                {merging ? 'Merging...' : 'Merge pull request'}
                            </button>
                        </div>
                    </div>
                )}

                {pr.status === 'merged' && (
                    <div className="border border-purple-500/30 rounded-md bg-purple-900/10 p-4 mt-4">
                        <div className="flex items-center gap-3 text-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-sm">Pull request successfully merged and closed</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
