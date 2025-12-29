import React from 'react';
import { TrashIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';

const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
    ];
    for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return count === 1 ? `1 ${interval.label} ago` : `${count} ${interval.label}s ago`;
        }
    }
    return 'just now';
};

export default function BranchList({ branches, defaultBranch, onDelete }) {
    if (!branches) return null;

    return (
        <div className="bg-white dark:bg-[#161b22] border dark:border-github-border border-gray-200 rounded-md overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-gray-50 dark:bg-[#161b22] border-b dark:border-github-border border-gray-200 font-semibold text-gray-900 dark:text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ArrowPathRoundedSquareIcon className="w-5 h-5 text-gray-500" />
                    <span>All Branches</span>
                </div>
                <span className="text-xs font-normal bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                    {branches.length} branches
                </span>
            </div>

            <ul className="divide-y divide-gray-200 dark:divide-[#21262d]">
                {branches.map(b => (
                    <li key={b.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0d1117] transition group">
                        <div className="mb-2 sm:mb-0">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-base font-semibold font-mono ${b.name === defaultBranch ? 'text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {b.name}
                                </span>
                                {b.name === defaultBranch && (
                                    <span className="text-[10px] uppercase tracking-wider border border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                        Default
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                {b.lastCommit && (
                                    <>
                                        <span>Updated {timeAgo(b.lastCommit.timestamp)}</span>
                                        <span>by <span className="text-gray-700 dark:text-gray-300 font-medium">{b.lastCommit.author?.username || 'Unknown'}</span></span>
                                        <span className="mx-1">•</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded text-gray-600 dark:text-gray-400">
                                            {b.lastCommit.hash ? b.lastCommit.hash.substring(0, 7) : ''}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {b.name !== defaultBranch && (
                                <button
                                    onClick={() => onDelete(b.name)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="Delete Branch"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
