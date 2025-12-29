import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { TrashIcon } from '@heroicons/react/24/outline';

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        api.get('/admin/logs').then(res => setLogs(res.data));
    }, []);

    const deleteLog = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log entry?")) return;
        try {
            await api.delete(`/admin/logs/${id}`);
            setLogs(logs.filter(log => log.id !== id));
        } catch (err) {
            alert('Failed to delete log');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>
            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-white dark:bg-[#0d1117] text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Action</th>
                            <th className="p-4 font-semibold">Admin</th>
                            <th className="p-4 font-semibold">Target ID</th>
                            <th className="p-4 font-semibold">Details</th>
                            <th className="p-4 font-semibold">IP Address</th>
                            <th className="p-4 font-semibold">Time</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors">
                                <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{log.action}</td>
                                <td className="p-4 text-gray-900 dark:text-white">{log.adminId?.username || 'System'}</td>
                                <td className="p-4 font-mono text-xs">{log.targetId || '-'}</td>
                                <td className="p-4 max-w-xs">
                                    {log.details ? (
                                        <pre className="text-xs font-mono bg-gray-100 dark:bg-[#0d1117] p-2 rounded overflow-x-auto max-w-[250px] whitespace-pre-wrap">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="p-4 font-mono text-xs">{log.ipAddress}</td>
                                <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => deleteLog(log.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 p-2 dark:hover:bg-red-900/30 rounded transition-colors"
                                        title="Delete Log"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
