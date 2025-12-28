import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const CreateRepo = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('JavaScript');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/repos', { name, description, isPrivate, language });
            // Redirect to the new repo page (we'll build that next)
            // For now, go back to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create repository');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="border-b border-github-border pb-4 mb-6">
                <h1 className="text-2xl font-bold">Create a new repository</h1>
                <p className="text-gray-400 text-sm">A repository contains all project files, including the revision history.</p>
            </div>

            {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-md mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold mb-2">Repository name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        className="w-full md:w-1/2 bg-[#0d1117] border border-github-border rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="my-awesome-project"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">Description <span className="font-normal text-gray-400">(optional)</span></label>
                    <input
                        type="text"
                        className="w-full bg-[#0d1117] border border-github-border rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">Primary Language</label>
                    <select
                        className="w-full md:w-1/2 bg-[#0d1117] border border-github-border rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {['JavaScript', 'TypeScript', 'Python', 'Go', 'Java', 'C++', 'HTML/CSS', 'Other'].map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                <div className="border-t border-github-border pt-4">
                    <div className="mb-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="visibility"
                                className="mt-1"
                                checked={!isPrivate}
                                onChange={() => setIsPrivate(false)}
                            />
                            <div>
                                <div className="flex items-center gap-2 font-bold"><GlobeAltIcon className="w-5 h-5 text-gray-400" /> Public</div>
                                <p className="text-sm text-gray-400">Anyone on the internet can see this repository. You choose who can commit.</p>
                            </div>
                        </label>
                    </div>
                    <div>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="radio"
                                name="visibility"
                                className="mt-1"
                                checked={isPrivate}
                                onChange={() => setIsPrivate(true)}
                            />
                            <div>
                                <div className="flex items-center gap-2 font-bold"><LockClosedIcon className="w-5 h-5 text-orange-400" /> Private</div>
                                <p className="text-sm text-gray-400">You choose who can see and commit to this repository.</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="border-t border-github-border pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-github-btn text-white px-6 py-2 rounded-md font-bold hover:bg-[#2ea043] transition disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create repository'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateRepo;
