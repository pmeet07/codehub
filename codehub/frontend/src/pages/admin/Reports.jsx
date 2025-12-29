import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ShieldCheckIcon, CheckCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function AdminReports() {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        api.get('/admin/reports').then(res => setReports(res.data));
    }, []);

    const resolve = async (id) => {
        await api.put(`/admin/reports/${id}/resolve`);
        setReports(reports.map(r => r._id === id ? { ...r, status: 'resolved' } : r));
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Moderation Requests</h1>
            <div className="grid gap-4">
                {reports.map(report => (
                    <div key={report.id} className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 p-4 rounded-lg flex justify-between items-center shadow-sm">
                        <div className="flex gap-4 items-start">
                            <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
                                <ShieldCheckIcon className="w-6 h-6" />
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-700 dark:text-white uppercase text-xs tracking-wider mb-1">
                                    Reported {report.targetType}
                                </h3>
                                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                    {report.targetDetails?.name || report.targetDetails?.username || 'Unknown Target'}
                                </p>
                                {report.targetDetails?.owner && (
                                    <p className="text-xs text-gray-500 mb-2">Owner: <span className="text-blue-600 dark:text-blue-400">{report.targetDetails.owner}</span></p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">Reason: <span className="text-yellow-600 dark:text-yellow-400 font-medium">{report.reason}</span></p>
                                <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">{report.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {report.targetType === 'repo' && report.targetDetails && (
                                <a
                                    href={`/${report.targetDetails.owner}/${report.targetDetails.name}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
                                >
                                    <EyeIcon className="w-4 h-4" /> View
                                </a>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold ${report.status === 'resolved'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400'
                                }`}>
                                {report.status}
                            </span>
                            {report.status !== 'resolved' && (
                                <button
                                    onClick={() => resolve(report.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <CheckCircleIcon className="w-4 h-4" /> Resolve
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
