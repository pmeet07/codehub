import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminLogs() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        api.get('/admin/logs').then(res => setLogs(res.data));
    }, []);

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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map(log => (
                            <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors">
                                <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{log.action}</td>
                                <td className="p-4 text-gray-900 dark:text-white">{log.adminId?.username || 'System'}</td>
                                <td className="p-4 font-mono text-xs">{log.targetId || '-'}</td>
                                <td className="p-4 max-w-xs truncate" title={JSON.stringify(log.details)}>
                                    {JSON.stringify(log.details || {})}
                                </td>
                                <td className="p-4 font-mono text-xs">{log.ipAddress}</td>
                                <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
