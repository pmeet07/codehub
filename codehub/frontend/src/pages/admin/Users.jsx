import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        api.get('/admin/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error(err));
    }, []);

    const toggleBan = async (id) => {
        try {
            const { data } = await api.put(`/admin/users/${id}/ban`);
            setUsers(users.map(u => u._id === id ? { ...u, isBanned: data.user.isBanned } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleTempBan = async (id) => {
        const days = prompt("Enter suspension duration in days (e.g., 1, 7, 30):");
        if (!days) return;

        try {
            await api.put(`/admin/users/${id}/temp-ban`, { durationDays: days });
            alert(`User suspended for ${days} days.`);
            // Refresh list to update status
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to suspend user');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">User Management</h1>

            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-white dark:bg-[#0d1117] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">User</th>
                            <th className="p-4 font-semibold">Role</th>
                            <th className="p-4 font-semibold">Joined</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => (
                            <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700" />
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-500">{user.email}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${user.role === 'admin'
                                        ? 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300'
                                        : 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    {user.isBanned ? (
                                        <span className="text-red-700 dark:text-red-400 font-medium bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Banned</span>
                                    ) : (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) ? (
                                        <span className="text-orange-700 dark:text-orange-400 font-medium bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded" title={`Until ${new Date(user.banExpiresAt).toLocaleDateString()}`}>Suspended</span>
                                    ) : (
                                        <span className="text-green-700 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">Active</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {user.role !== 'admin' && (
                                        <div className="flex gap-2 justify-end">
                                            {!user.isBanned && (
                                                <button
                                                    onClick={() => handleTempBan(user._id)}
                                                    className="text-xs px-3 py-1 rounded border border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-500 dark:text-orange-400 dark:hover:bg-orange-900/30 transition"
                                                >
                                                    Suspend
                                                </button>
                                            )}
                                            <button
                                                onClick={() => toggleBan(user._id)}
                                                className={`text-xs px-3 py-1 rounded border transition ${user.isBanned
                                                    ? 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/30'
                                                    : 'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/30'
                                                    }`}
                                            >
                                                {user.isBanned ? 'Unban' : 'Perm Ban'}
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No users found.</div>
                )}
            </div>
        </div>
    );
}
