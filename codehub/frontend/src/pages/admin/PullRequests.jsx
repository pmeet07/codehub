import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminPullRequests() {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Need an endpoint for ALL PRs which we haven't strictly defined in backend router for admin yet
        // But we can reuse the generic list or create new one.
        // Let's assume we use the existing PR list but maybe iterate repos or add a special admin route.
        // Wait, the prompt asked for "GET /admin/pull-requests".
        // I need to add that route to admin routes in backend.

        // For now, let's fetch from the new endpoint I will create.
        api.get('/admin/pull-requests')
            .then(res => {
                setPrs(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleForceClose = async (id) => {
        if (!window.confirm("Are you sure you want to force close this PR?")) return;
        try {
            await api.put(`/admin/pull-requests/${id}/close`); // Need backend impl
            setPrs(prs.map(p => p._id === id ? { ...p, status: 'closed' } : p));
        } catch (err) {
            alert("Failed to close PR");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this PR? This cannot be undone.")) return;
        try {
            await api.delete(`/admin/pull-requests/${id}`);
            setPrs(prs.filter(p => p._id !== id));
        } catch (err) {
            alert("Failed to delete PR");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading PRs...</div>;

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold dark:text-white text-gray-900 mb-6">Pull Request Moderation</h1>

            <div className="dark:bg-[#161b22] bg-white border dark:border-gray-700 border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-[#21262d] border-b dark:border-gray-700 border-gray-200">
                            <th className="p-4 text-sm font-semibold dark:text-gray-300 text-gray-700">Title</th>
                            <th className="p-4 text-sm font-semibold dark:text-gray-300 text-gray-700">Repository</th>
                            <th className="p-4 text-sm font-semibold dark:text-gray-300 text-gray-700">Author</th>
                            <th className="p-4 text-sm font-semibold dark:text-gray-300 text-gray-700">Status</th>
                            <th className="p-4 text-sm font-semibold dark:text-gray-300 text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-8 text-center dark:text-gray-500 text-gray-400">No pull requests found.</td>
                            </tr>
                        ) : (
                            prs.map(pr => (
                                <tr key={pr._id} className="border-b dark:border-gray-700 border-gray-100 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="p-4 dark:text-white text-gray-800 font-medium">{pr.title}</td>
                                    <td className="p-4 text-sm dark:text-gray-400 text-gray-600">
                                        {pr.repository?.name || 'Unknown'}
                                        <span className="block text-xs text-gray-500">#{pr.repository?._id?.substring(0, 6)}</span>
                                    </td>
                                    <td className="p-4 dark:text-gray-300 text-gray-700">{pr.author?.username}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pr.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            pr.status === 'merged' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {pr.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {pr.status === 'open' && (
                                                <button
                                                    onClick={() => handleForceClose(pr._id)}
                                                    className="text-orange-500 hover:text-orange-700 text-sm font-bold border border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-3 py-1 rounded transition"
                                                >
                                                    Close
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(pr._id)}
                                                className="text-white bg-red-600 hover:bg-red-700 text-sm font-bold px-3 py-1 rounded transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
