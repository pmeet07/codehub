import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { UsersIcon, ServerIcon, LockClosedIcon, BoltIcon, ArrowTrendingUpIcon, SparklesIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color, subtext, delay }) => (
    <div
        className="dark:bg-[#161b22] bg-white p-6 rounded-lg border dark:border-gray-700 border-gray-200 flex items-start justify-between hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-fade-in-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div>
            <p className="dark:text-gray-400 text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold dark:text-white text-gray-900 mb-1">{value}</h3>
            {subtext && <p className="text-xs text-green-500 flex items-center gap-1"><ArrowTrendingUpIcon className="w-3 h-3" /> {subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </div>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRepos: 0,
        privateRepos: 0,
        publicRepos: 0,
        totalPRs: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard')
            .then(res => {
                setStats(res.data.stats);
                setRecentUsers(res.data.recentUsers || []);
                setRecentLogs(res.data.recentLogs || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
                setStats({ totalUsers: 0, totalRepos: 0, privateRepos: 0, publicRepos: 0 });
            });
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold dark:text-white text-gray-900">Dashboard Overview</h1>
                <p className="dark:text-gray-400 text-gray-500">Welcome back, Administrator.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={UsersIcon}
                    color="text-blue-500"
                    subtext="Registered users"
                    delay="0"
                />
                <StatCard
                    title="Total Repositories"
                    value={stats.totalRepos}
                    icon={ServerIcon}
                    color="text-green-500"
                    subtext={`${stats.publicRepos} public`}
                    delay="100"
                />
                <StatCard
                    title="Pull Requests"
                    value={stats.totalPRs || 0}
                    icon={ArrowTrendingUpIcon}
                    color="text-orange-500"
                    subtext="Across all repos"
                    delay="150"
                />
                <StatCard
                    title="Private Repos"
                    value={stats.privateRepos}
                    icon={LockClosedIcon}
                    color="text-yellow-500"
                    subtext="Private usage"
                    delay="200"
                />
                <StatCard
                    title="AI Requests (24h)"
                    value={stats.aiUsage?.dailyRequests || '0'}
                    icon={SparklesIcon}
                    color="text-purple-500"
                    subtext={`Est. Cost: $${stats.aiUsage?.estimatedCost || '0.00'}`}
                    delay="300"
                />
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Newer Users */}
                <div className="dark:bg-[#161b22] bg-white border dark:border-gray-700 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="font-bold dark:text-white text-gray-900 mb-4 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 dark:text-gray-400 text-gray-500" /> Newest Members
                    </h3>
                    <div className="space-y-4">
                        {recentUsers.length === 0 ? (
                            <p className="text-sm dark:text-gray-500 text-gray-400 text-center py-4">No new members yet.</p>
                        ) : (
                            recentUsers.map((user, idx) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between border-b dark:border-gray-700 border-gray-100 pb-3 last:border-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded transition-colors"
                                    style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s forwards`, opacity: 0 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl || "https://github.com/github.png"} className="w-8 h-8 rounded-full dark:bg-gray-700 bg-gray-200" alt="" />
                                        <div>
                                            <p className="text-sm font-medium dark:text-white text-gray-900">{user.username}</p>
                                            <p className="text-xs dark:text-gray-400 text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs dark:text-gray-500 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Audit Logs */}
                <div className="dark:bg-[#161b22] bg-white border dark:border-gray-700 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <h3 className="font-bold dark:text-white text-gray-900 mb-4 flex items-center gap-2">
                        <BoltIcon className="w-5 h-5 dark:text-gray-400 text-gray-500" /> Recent Admin Actions
                    </h3>
                    <div className="space-y-4">
                        {recentLogs.length === 0 ? (
                            <p className="text-sm dark:text-gray-500 text-gray-400 text-center py-4">No recent actions recorded.</p>
                        ) : (
                            recentLogs.map((log, idx) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 border-b dark:border-gray-700 border-gray-100 pb-3 last:border-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded transition-colors"
                                    style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s forwards`, opacity: 0 }}
                                >
                                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></div>
                                    <div>
                                        <p className="text-sm dark:text-gray-200 text-gray-700">
                                            <span className="font-bold text-blue-500 dark:text-blue-400">{log.action}</span> on <span className="font-mono dark:text-gray-400 text-gray-500">{log.details?.username || (log.targetId ? log.targetId.substring(0, 8) : 'N/A')}</span>
                                        </p>
                                        <p className="text-xs dark:text-gray-500 text-gray-400">
                                            by {log.adminId?.username || 'System'} • {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
