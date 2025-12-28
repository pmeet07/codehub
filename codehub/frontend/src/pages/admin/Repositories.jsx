import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { TrashIcon, LinkIcon } from '@heroicons/react/24/outline';

export default function AdminRepositories() {
    const [repos, setRepos] = useState([]);

    useEffect(() => {
        loadRepos();
    }, []);

    const loadRepos = async () => {
        try {
            const { data } = await api.get('/admin/repos');
            setRepos(data);
        } catch (err) {
            console.error(err);
        }
    };

    const deleteRepo = async (id) => {
        if (!window.confirm("Are you sure you want to delete this repository? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/repos/${id}`);
            loadRepos();
        } catch (err) {
            alert('Failed to delete repo');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Repository Management</h1>
            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-white dark:bg-[#0d1117] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Repository</th>
                            <th className="p-4 font-semibold">Owner</th>
                            <th className="p-4 font-semibold">Visibility</th>
                            <th className="p-4 font-semibold">Created</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {repos.map(repo => (
                            <tr key={repo._id} className="hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors">
                                <td className="p-4 font-medium text-gray-900 dark:text-white">{repo.name}</td>
                                <td className="p-4">{repo.owner?.username || 'Unknown'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${repo.isPrivate
                                        ? 'bg-yellow-100 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-500'
                                        : 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-500'
                                        }`}>
                                        {repo.isPrivate ? 'Private' : 'Public'}
                                    </span>
                                </td>
                                <td className="p-4">{new Date(repo.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => deleteRepo(repo._id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 p-2 dark:hover:bg-red-900/30 rounded transition-colors"
                                        title="Delete Repository"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {repos.length === 0 && <div className="p-8 text-center">No repositories found.</div>}
            </div>
        </div>
    );
}
