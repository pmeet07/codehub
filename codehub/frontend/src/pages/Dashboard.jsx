import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpenIcon, SunIcon, MoonIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const { user, setUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        bio: '',
        location: '',
        website: '',
        avatarUrl: ''
    });

    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const { data } = await api.get('/repos/user');
                setRepos(data);
            } catch (err) {
                console.error("Failed to fetch repos", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchRepos();
    }, [user]);

    const handleEditClick = () => {
        setEditForm({
            bio: user.bio || '',
            location: user.location || '',
            website: user.website || '',
            avatarUrl: user.avatarUrl || ''
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/users/profile', editForm);
            setUser(res.data.user);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile ", err);
            alert("Failed to update profile");
        }
    };

    if (loading) return <div className="text-center mt-10 dark:text-white text-gray-900">Loading...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-1/4"
            >
                <div className="dark:bg-[#161b22] bg-white border dark:border-gray-700 border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={user?.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border-2 dark:border-gray-600 border-gray-300" />
                        <div>
                            <h2 className="text-xl font-bold dark:text-white text-gray-900">{user?.username}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Pro Member</p>
                        </div>
                    </div>

                    <button
                        onClick={handleEditClick}
                        className="w-full dark:bg-[#21262d] bg-gray-100 hover:bg-gray-200 dark:hover:bg-[#30363d] border dark:border-gray-600 border-gray-300 rounded-md py-1.5 text-sm font-semibold mb-3 dark:text-white text-gray-700 transition-colors"
                    >
                        Edit Profile
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="w-full dark:bg-[#21262d] bg-gray-100 hover:bg-gray-200 dark:hover:bg-[#30363d] border dark:border-gray-600 border-gray-300 rounded-md py-1.5 text-sm font-semibold mb-4 flex items-center justify-center gap-2 dark:text-white text-gray-700 transition-colors"
                    >
                        {theme === 'dark' ? (
                            <>
                                <SunIcon className="w-4 h-4" /> Light Mode
                            </>
                        ) : (
                            <>
                                <MoonIcon className="w-4 h-4" /> Dark Mode
                            </>
                        )}
                    </button>

                    <div className="text-sm dark:text-gray-400 text-gray-600 space-y-2">
                        <p>📍 {user?.location || 'Earth'}</p>
                        <p>📝 {user?.bio || 'No bio yet.'}</p>
                        <p>🔗 <a href={user?.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block">{user?.website || 'https://codehub.com'}</a></p>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-6 border-b dark:border-gray-800 border-gray-200 pb-4"
                >
                    <h1 className="text-2xl font-bold dark:text-white text-gray-900">Your Repositories</h1>
                    <Link to="/new" className="bg-[#238636] text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-[#2ea043] flex items-center gap-2 transition-colors shadow-sm">
                        <BookOpenIcon className="w-4 h-4" /> New
                    </Link>
                </motion.div>

                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <input type="text" placeholder="Find a repository..." className="w-full bg-transparent border dark:border-gray-700 border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none dark:text-white text-gray-900 transition-all placeholder-gray-500" />
                    </div>

                    <ul className="flex flex-col gap-3">
                        <AnimatePresence>
                            {repos.map((repo, i) => (
                                <motion.li
                                    key={repo._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-5 border dark:border-gray-800 border-gray-200 rounded-xl bg-white dark:bg-[#161b22]/50 hover:border-blue-500/50 transition-all flex justify-between items-start group"
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-blue-500 group-hover:text-blue-400 transition-colors">
                                                <Link to={`/${user.username}/${repo.name}`}>{repo.name}</Link>
                                            </h3>
                                            <span className="text-xs border dark:border-gray-600 border-gray-300 rounded-full px-2.5 py-0.5 text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800">
                                                {repo.isPrivate ? 'Private' : 'Public'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">{repo.description || 'No description provided.'}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                            <span>Updated {new Date(repo.updatedAt || repo.createdAt).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                                JavaScript
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="bg-gray-100 dark:bg-[#21262d] border border-gray-300 dark:border-gray-700 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 hover:border-gray-400 dark:hover:border-gray-500 transition-colors dark:text-gray-300 text-gray-700">
                                            Star
                                        </button>
                                    </div>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                        {repos.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border dark:border-gray-800 dashed border-gray-300 border-dashed">
                                You don't have any repositories yet.
                            </motion.div>
                        )}
                    </ul>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="dark:bg-[#161b22] bg-white border dark:border-gray-700 border-gray-200 rounded-xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold dark:text-white text-gray-900">Edit Profile</h3>
                                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-400 text-gray-700 mb-1">Avatar URL</label>
                                    <input
                                        type="text"
                                        className="w-full dark:bg-[#0d1117] bg-gray-50 border dark:border-gray-600 border-gray-300 rounded-md px-3 py-2 dark:text-white text-gray-900 focus:border-blue-500 outline-none transition-colors"
                                        value={editForm.avatarUrl}
                                        onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-400 text-gray-700 mb-1">Bio</label>
                                    <textarea
                                        className="w-full dark:bg-[#0d1117] bg-gray-50 border dark:border-gray-600 border-gray-300 rounded-md px-3 py-2 dark:text-white text-gray-900 focus:border-blue-500 outline-none transition-colors"
                                        rows="3"
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium dark:text-gray-400 text-gray-700 mb-1">Details</label>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            placeholder="Location"
                                            className="w-full dark:bg-[#0d1117] bg-gray-50 border dark:border-gray-600 border-gray-300 rounded-md px-3 py-2 dark:text-white text-gray-900 focus:border-blue-500 outline-none transition-colors"
                                            value={editForm.location}
                                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Website (https://...)"
                                            className="w-full dark:bg-[#0d1117] bg-gray-50 border dark:border-gray-600 border-gray-300 rounded-md px-3 py-2 dark:text-white text-gray-900 focus:border-blue-500 outline-none transition-colors"
                                            value={editForm.website}
                                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-sm font-medium dark:text-[#c9d1d9] text-gray-700 dark:bg-[#21262d] bg-gray-200 hover:bg-gray-300 dark:hover:bg-[#30363d] rounded-md border dark:border-gray-600 border-gray-300 transition-colors">Cancel</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#238636] hover:bg-[#2ea043] rounded-md transition-colors shadow-sm">Save profile</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    function handleCancelEdit() {
        setIsEditing(false);
    }
};

export default Dashboard;
