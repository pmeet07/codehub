/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';

export default function FileViewer({ file, content, onClose, repo, branch }) {
    const [showExplain, setShowExplain] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState('English');
    const [error, setError] = useState(null);

    // Debug / Fix State
    const [showDebug, setShowDebug] = useState(false);
    const [bugs, setBugs] = useState([]);
    const [loadingDebug, setLoadingDebug] = useState(false);


    const [isEditing, setIsEditing] = useState(false);
    const [newContent, setNewContent] = useState(content);
    const [commitMessage, setCommitMessage] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setNewContent(content);
    }, [content]);

    const handleSave = async () => {
        if (!newContent) return;
        setSaving(true);
        try {
            await api.post(`/repos/${repo.id}/file`, {
                branch: branch || 'main',
                path: file.path,
                content: newContent,
                message: commitMessage || `Update ${file.path}`
            });
            alert('File updated successfully!');
            setIsEditing(false);
            onClose(); // Close viewer to force refresh on re-open or trigger reload
            window.location.reload(); // Simple brute force update for now to reflect changes in tree/content
        } catch (err) {
            console.error(err);
            alert("Failed to update file: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    // Simple language detection based on extension
    const getLanguage = (filename) => {
        const ext = filename?.split('.').pop().toLowerCase();
        const map = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'md': 'markdown',
            'go': 'go',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp'
        };
        return map[ext] || 'plaintext';
    };

    const handleExplain = async () => {
        if (!showExplain) {
            setShowExplain(true);
            setShowDebug(false); // Close debug if open
            // Only fetch if empty or we want to ensure fresh start, 
            // but usually check if empty to avoid refetching on toggle.
            // However, if we closed it, we might want to keep the old one.
            if (!explanation) {
                fetchExplanation(language);
            }
        } else {
            setShowExplain(false);
        }
    };

    const fetchExplanation = async (lang) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/ai/explain', { code: content, language: lang || language });
            setExplanation(res.data.explanation);
        } catch (err) {
            console.error(err);
            const msg = (err.response?.data?.error ? `${err.response.data.message}: ${err.response.data.error}` : err.response?.data?.message) || "Failed to generate explanation. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        if (showExplain) {
            fetchExplanation(newLang);
        }
    };

    const handleDebug = async () => {
        if (!showDebug) {
            setShowDebug(true);
            setShowExplain(false);
            if (bugs.length === 0) {
                fetchDebug();
            }
        } else {
            setShowDebug(false);
        }
    };

    const fetchDebug = async () => {
        setLoadingDebug(true);
        setError(null);
        try {
            const res = await api.post('/ai/debug', { code: content });
            if (res.data.error) {
                setError(res.data.error);
                setBugs([]);
            } else {
                setBugs(res.data.bugs || []);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to connect to server");
        } finally {
            setLoadingDebug(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-[#0d1117] border border-github-border rounded-lg w-full max-w-[90vw] h-[85vh] flex flex-col shadow-2xl relative overflow-hidden transition-all duration-300">
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-github-border bg-[#161b22] px-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white opacity-80">{file.path}</span>
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{getLanguage(file.path)}</span>
                        </div>

                        <button
                            onClick={handleExplain}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showExplain
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 ring-1 ring-purple-400'
                                : 'bg-[#21262d] text-gray-300 hover:text-white hover:bg-[#30363d] border border-gray-700'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6 20.25a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 01.75.75v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 01-.75-.75v-.008c0-.414-.336-.75-.75-.75h-.008a.75.75 0 01-.75-.75v-.008c0-.414.336-.75.75-.75h.008zm11.25-15a.75.75 0 00-1.5 0v.008c0 .414-.336.75-.75.75h-.008a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008c0-.414.336-.75.75-.75h.008a.75.75 0 00.75.75v.008c0-.414-.336-.75-.75-.75h-.008a.75.75 0 00-.75-.75v-.008c0-.414.336-.75.75-.75h.008z" clipRule="evenodd" />
                            </svg>
                            {showExplain ? 'Hide Explanation' : 'Explain'}
                        </button>

                        <button
                            onClick={handleDebug}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showDebug
                                ? 'bg-red-600 text-white shadow-lg shadow-red-900/50 ring-1 ring-red-400'
                                : 'bg-[#21262d] text-gray-300 hover:text-white hover:bg-[#30363d] border border-gray-700'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                <path d="M12 15.75a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008a.75.75 0 01.75-.75h.008z" />
                            </svg>
                            {showDebug ? 'Close Bugs' : 'Scan Bugs'}
                        </button>

                        {/* Edit Controls */}
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-[#21262d] text-gray-300 hover:text-white hover:bg-[#30363d] border border-gray-700 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                </svg>
                                Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                                <input
                                    type="text"
                                    placeholder="Commit message..."
                                    className="bg-[#0d1117] border border-gray-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500 w-48"
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-500 border border-green-500 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Commit'}
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setNewContent(content); }}
                                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-transparent text-gray-400 hover:text-white border border-transparent hover:border-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1 hover:bg-gray-800 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Monaco Editor */}
                    <div className={`transition-all duration-300 ease-in-out ${(showExplain || showDebug) ? 'w-1/2 border-r border-github-border' : 'w-full'}`}>
                        <Editor
                            height="100%"
                            defaultLanguage={getLanguage(file.path)}
                            value={isEditing ? newContent : content}
                            onChange={(value) => setNewContent(value)}
                            theme="vs-dark"
                            options={{
                                readOnly: !isEditing,
                                minimap: { enabled: !(showExplain || showDebug) }, // Disable minimap when split
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                lineNumbers: 'on',
                                automaticLayout: true,
                                wordWrap: 'on',
                                padding: { top: 10 }
                            }}
                        />
                    </div>

                    {/* AI Explanation Panel */}
                    {showExplain && (
                        <div className="w-1/2 bg-[#0d1117] flex flex-col h-full animate-in slide-in-from-right-10 duration-300">
                            {/* Panel Toolbar */}
                            <div className="flex items-center justify-between p-3 border-b border-github-border bg-[#161b22]/50 backdrop-blur">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                    AI Explanation
                                </h3>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-400">Language:</label>
                                    <select
                                        value={language}
                                        onChange={handleLanguageChange}
                                        disabled={loading}
                                        className="bg-[#21262d] text-white text-xs border border-gray-700 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500 outline-none hover:bg-[#30363d] cursor-pointer"
                                    >
                                        <option value="English">English</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Gujarati">Gujarati</option>
                                    </select>
                                </div>
                            </div>

                            {/* Markdown Content */}
                            <div className="flex-1 overflow-y-auto p-6 text-gray-300 prose prose-invert prose-sm max-w-none">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
                                        <div className="relative w-10 h-10">
                                            <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full"></div>
                                            <div className="absolute inset-0 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        <p className="text-sm font-mono tracking-wide text-purple-300 animate-pulse">Thinking in {language}...</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center h-full text-red-400 gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                        <p>{error}</p>
                                        <button onClick={() => fetchExplanation(language)} className="text-xs bg-red-500/10 text-red-400 px-4 py-1.5 rounded hover:bg-red-500/20 transition-colors">
                                            Try Again
                                        </button>
                                    </div>
                                ) : (
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-700" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-white mt-6 mb-3" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-md font-medium text-purple-300 mt-4 mb-2" {...props} />,
                                            p: ({ node, ...props }) => <p className="leading-relaxed mb-4 text-gray-300" {...props} />,
                                            li: ({ node, ...props }) => <li className="my-1" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="text-purple-200 font-semibold" {...props} />,
                                            code: ({ node, inline, className, children, ...props }) => {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return !inline ? (
                                                    <div className="bg-[#1e1e1e] p-3 rounded-md my-4 border border-gray-800 overflow-x-auto">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </div>
                                                ) : (
                                                    <code className="bg-[#2d333b] px-1.5 py-0.5 rounded text-purple-200 text-xs font-mono" {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {explanation}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bug Detection Panel */}
                    {showDebug && (
                        <div className="w-1/2 bg-[#0d1117] flex flex-col h-full animate-in slide-in-from-right-10 duration-300 border-l border-github-border">
                            <div className="flex items-center justify-between p-3 border-b border-github-border bg-[#161b22]/50 backdrop-blur">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    Bug Detection
                                </h3>
                                <button onClick={fetchDebug} className="text-xs text-blue-400 hover:text-blue-300 hover:underline">
                                    Re-scan
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {loadingDebug && (
                                    <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-60">
                                        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                                        <p className="text-sm text-red-300 animate-pulse">Analyzing code for defects...</p>
                                    </div>
                                )}

                                {!loadingDebug && !error && bugs.length === 0 && (
                                    <div className="text-center text-green-400 mt-20">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 opacity-50">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                        <p>No bugs found! Good job.</p>
                                    </div>
                                )}

                                {!loadingDebug && error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-red-400 text-center">
                                        <p className="font-semibold mb-2">Analysis Failed</p>
                                        <p className="text-sm opacity-80">{error}</p>
                                        <button onClick={fetchDebug} className="mt-3 text-xs bg-red-500/20 px-3 py-1 rounded hover:bg-red-500/30 transition">
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {!loadingDebug && bugs.map((bug, i) => (
                                    <div key={i} className="bg-[#161b22] border border-red-900/30 rounded-lg p-3 hover:border-red-500/50 transition-all group">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${bug.severity === 'High' ? 'bg-red-500/20 text-red-400' :
                                                    bug.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {bug.severity}
                                                </span>
                                                <span className="text-xs text-gray-400 font-mono">Line {bug.line}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{bug.type}</span>
                                        </div>

                                        <p className="text-sm text-gray-200 font-medium mb-1">{bug.message}</p>
                                        <p className="text-xs text-gray-400 mb-3 leading-relaxed">{bug.explanation}</p>

                                        {bug.fix && (
                                            <div className="bg-black/30 rounded p-2 border border-gray-800 relative group-hover:border-gray-700 transition-colors">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Suggested Fix</span>
                                                </div>
                                                <code className="text-xs font-mono text-green-300 block overflow-x-auto">
                                                    {bug.fix}
                                                </code>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-[#161b22] p-1 border-t border-github-border text-center text-[10px] text-gray-500 shrink-0">
                    Read-only view • Powered by Monaco Editor • Explanation by Gemini AI
                </div>
            </div>
        </div>
    );
}
