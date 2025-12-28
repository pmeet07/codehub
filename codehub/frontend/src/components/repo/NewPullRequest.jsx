import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function NewPullRequest({ repo, onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        sourceBranch: 'main',
        targetBranch: 'main'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (repo && repo.branches && repo.branches.length > 0) {
            const defaultBranch = repo.defaultBranch || 'main';
            // Find a source branch that is different from default
            let initialSource = repo.branches.find(b => b !== defaultBranch);

            // If only one branch exists, source will be same as target (user must create branch first)
            if (!initialSource) initialSource = defaultBranch;

            setFormData(prev => ({
                ...prev,
                title: `Merge ${initialSource} to ${defaultBranch}`, // Auto-title
                targetBranch: defaultBranch,
                sourceBranch: initialSource
            }));
        }
    }, [repo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/pull-requests', {
                ...formData,
                sourceRepoId: repo._id,
                targetRepoId: repo.forkedFrom || repo._id
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create PR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#161b22] border border-github-border rounded-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create Pull Request</h2>

            {error && <div className="bg-red-900/50 text-red-200 p-3 rounded-md mb-4 border border-red-800">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-[#0d1117] border border-gray-600 rounded-md px-3 py-2 text-white outline-none focus:border-blue-500"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                        className="w-full bg-[#0d1117] border border-gray-600 rounded-md px-3 py-2 text-white outline-none focus:border-blue-500 min-h-[100px]"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Source Branch</label>
                        <select
                            className="w-full bg-[#0d1117] border border-gray-600 rounded-md px-3 py-2 text-white outline-none"
                            value={formData.sourceBranch}
                            onChange={e => setFormData({ ...formData, sourceBranch: e.target.value })}
                        >
                            {repo.branches && repo.branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Target Branch</label>
                        <select
                            className={`w-full bg-[#0d1117] border rounded-md px-3 py-2 text-white outline-none ${formData.sourceBranch === formData.targetBranch ? 'border-red-500' : 'border-gray-600'}`}
                            value={formData.targetBranch}
                            onChange={e => setFormData({ ...formData, targetBranch: e.target.value })}
                        >
                            {/* Ideally fetch target repo branches if different. For now assume same names or same repo */}
                            {repo.branches && repo.branches.map(b => (
                                <option key={b} value={b} disabled={b === formData.sourceBranch}>
                                    {b} {b === formData.sourceBranch ? '(Same as Source)' : ''}
                                </option>
                            ))}
                        </select>
                        {formData.sourceBranch === formData.targetBranch && (
                            <p className="text-red-400 text-xs mt-1">Source and target cannot be the same.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-300 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || formData.sourceBranch === formData.targetBranch}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? 'Creating...' : 'Create Pull Request'}
                    </button>
                </div>
            </form>
        </div>
    );
}
