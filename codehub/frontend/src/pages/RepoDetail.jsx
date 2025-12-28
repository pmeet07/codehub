import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import FileViewer from '../components/repo/FileViewer';
import PullRequestList from '../components/repo/PullRequestList';
import NewPullRequest from '../components/repo/NewPullRequest';
import PullRequestDetail from '../components/repo/PullRequestDetail';
import { FolderIcon, DocumentIcon, ClipboardDocumentIcon, EyeIcon, StarIcon, ShareIcon, CodeBracketIcon, PlusIcon, ClockIcon, ArrowPathRoundedSquareIcon, ShieldCheckIcon, ArrowDownTrayIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

function timeAgo(date) {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active
            ? 'border-orange-500 text-white'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
        {count !== undefined && <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 rounded-full ml-1">{count}</span>}
    </button>
);

export default function RepoDetail() {
    const { username, repoName } = useParams();
    const navigate = useNavigate();
    const [repo, setRepo] = useState(null);
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');

    // Tabs & PR State
    const [activeTab, setActiveTab] = useState('code');
    const [prView, setPrView] = useState('list'); // list, create, detail
    const [selectedPrId, setSelectedPrId] = useState(null);
    const [commits, setCommits] = useState([]);

    const handleFileClick = async (file) => {
        setSelectedFile(file);
        try {
            const { data } = await api.get(`/repos/${repo._id}/blob/${file.hash}?t=${Date.now()}`);
            setFileContent(data);
        } catch (e) {
            console.error("Failed to load file content", e);
            setFileContent("Error loading file content.");
        }
    };

    const fetchCommits = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/repos/${repo._id}/commits?branch=${selectedBranch}`);
            setCommits(data);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const [selectedBranch, setSelectedBranch] = useState('main');
    const [currentCommit, setCurrentCommit] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTree = tree.filter(file => file.path.toLowerCase().includes(searchQuery.toLowerCase()));

    useEffect(() => {
        async function fetchRepo() {
            try {
                // Determine if we are looking for a fork? No API handles finding by owner/name
                const { data } = await api.get(`/repos/${username}/${repoName}?branch=${selectedBranch}&t=${Date.now()}`);
                setRepo(data.repo);
                setTree(data.tree || []);
                setCurrentCommit(data.currentCommit);
            } catch (e) {
                console.error("Failed to load repo", e);
                setError("Repository not found");
            } finally {
                setLoading(false);
            }
        }
        fetchRepo();
    }, [username, repoName, selectedBranch]);

    // Fetch commits when tab changes to commits
    useEffect(() => {
        if (activeTab === 'commits' && repo) {
            fetchCommits();
        }
    }, [activeTab, repo, selectedBranch]);

    const copyCloneCommand = () => {
        const command = `codehub clone http://localhost:5173/${username}/${repoName}`;
        navigator.clipboard.writeText(command);
        alert("Copied to clipboard!");
    }

    const handleFork = async () => {
        if (!confirm(`Fork ${username}/${repoName} to your account?`)) return;
        try {
            const { data } = await api.post(`/repos/${repo._id}/fork`);
            alert("Fork created successfully!");
            navigate('/dashboard');
        } catch (e) {
            alert(e.response?.data?.message || "Fork failed");
        }
    };

    const createBranch = async (branchName) => {
        try {
            await api.post(`/repos/${repo._id}/branches`, {
                branchName,
                fromBranch: selectedBranch
            });
            // Optimistic update or refetch
            setRepo(prev => ({ ...prev, branches: [...prev.branches, branchName] }));
            setSelectedBranch(branchName);
        } catch (e) {
            alert(e.response?.data?.message || "Failed to create branch");
        }
    };

    const deleteBranch = async (branchName) => {
        try {
            await api.delete(`/repos/${repo._id}/branches/${branchName}`);
            setRepo(prev => ({ ...prev, branches: prev.branches.filter(b => b !== branchName) }));
            setSelectedBranch(repo.defaultBranch);
        } catch (e) {
            alert(e.response?.data?.message || "Failed to delete branch");
        }
    };

    const handleReport = async () => {
        const reason = prompt("Reason for reporting this repository (e.g., Spam, Malware):");
        if (!reason) return;

        try {
            await api.post('/reports', {
                targetType: 'repo',
                targetId: repo._id,
                reason,
                description: 'User report via frontend'
            });
            alert("Report submitted successfully. Administrators will review it.");
        } catch (e) {
            console.error(e);
            alert("Failed to submit report.");
        }
    };

    if (loading) return <div className="text-center mt-10 text-gray-400">Loading Repository...</div>;
    if (error) return <div className="text-center mt-10 text-red-400">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 bg-white dark:bg-[#161b22] border dark:border-github-border border-gray-200 p-4 rounded-md shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex flex-wrap items-center gap-2 mb-2">
                            <DocumentIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">{repo.owner.username}</Link>
                            <span className="text-gray-400 dark:text-gray-500">/</span>
                            <span className="text-gray-900 dark:text-white">{repo.name}</span>
                            <span className="ml-2 text-xs bg-gray-100 dark:bg-[#21262d] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 font-medium">
                                {repo.isPrivate ? 'Private' : 'Public'}
                            </span>
                        </h1>
                        {repo.forkedFrom && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <span>forked from</span>
                                <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">original repository</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-gray-50 dark:bg-[#21262d] border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#30363d] transition">
                            <StarIcon className="w-4 h-4" />
                            Star
                        </button>
                        <button
                            onClick={handleFork}
                            className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-gray-50 dark:bg-[#21262d] border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#30363d] transition"
                        >
                            <ArrowPathRoundedSquareIcon className="w-4 h-4" />
                            Fork
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b dark:border-github-border border-gray-200 mb-6 flex gap-4 overflow-x-auto">
                <TabButton
                    active={activeTab === 'code'}
                    onClick={() => setActiveTab('code')}
                    icon={CodeBracketIcon}
                    label="Code"
                />
                <TabButton
                    active={activeTab === 'pull-requests'}
                    onClick={() => {
                        setActiveTab('pull-requests');
                        // Quick re-fetch to ensure branches are up to date!
                        setLoading(true); // Optional: show loading state
                        api.get(`/repos/${username}/${repoName}?branch=${selectedBranch}&t=${Date.now()}`)
                            .then(({ data }) => {
                                setRepo(data.repo);
                                setLoading(false);
                            })
                            .catch(() => setLoading(false));
                    }}
                    icon={ArrowPathRoundedSquareIcon}
                    label="Pull Requests"
                />
                <TabButton
                    active={activeTab === 'commits'}
                    onClick={() => setActiveTab('commits')}
                    icon={ClockIcon}
                    label="Commits"
                />
                {/* Add more tabs like Issues, Settings later */}
            </div>

            {/* File Viewer Modal */}
            {selectedFile && (
                <FileViewer
                    file={selectedFile}
                    content={fileContent}
                    repo={repo}
                    branch={selectedBranch}
                    onClose={() => { setSelectedFile(null); setFileContent(''); }}
                />
            )}

            {/* Content Area */}


            {activeTab === 'commits' && (
                <div className="flex gap-6">
                    <div className="flex-1">
                        <div className="bg-white dark:bg-[#161b22] border dark:border-github-border border-gray-200 rounded-md overflow-hidden">
                            <div className="p-4 border-b dark:border-github-border border-gray-200 bg-gray-50 dark:bg-[#161b22] flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Commit History</h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Branch: <span className="font-mono">{selectedBranch}</span></div>
                            </div>

                            {commits.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No commits found.</div>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-[#21262d]">
                                    {commits.map((commit) => (
                                        <li key={commit.hash} className="p-4 hover:bg-gray-50 dark:hover:bg-[#0d1117] transition">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                                                        {commit.message}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                        {commit.author && commit.author.avatarUrl ? (
                                                            <img src={commit.author.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                                                        ) : (
                                                            <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                                        )}
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            {commit.author ? commit.author.username : 'Unknown'}
                                                        </span>
                                                        <span>committed {timeAgo(commit.timestamp)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-mono text-xs text-gray-600 dark:text-gray-400 border dark:border-gray-700 border-gray-200 rounded px-2 py-1 bg-white dark:bg-[#21262d]">
                                                        {commit.hash.substring(0, 7)}
                                                    </div>
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" title="Browse files at this point">
                                                        <CodeBracketIcon className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    {/* Sidebar could go here if needed */}
                </div>
            )}

            {activeTab === 'code' ? (
                <div className="flex flex-col-reverse md:flex-row gap-6">
                    {/* Main Content (File Tree) */}
                    <div className="flex-1">

                        {/* Controls Row: Branch Selector & Branch Actions */}
                        <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="relative group">
                                    <select
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                        className="appearance-none bg-gray-50 dark:bg-[#21262d] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md pl-8 pr-8 py-1.5 text-sm outline-none focus:border-blue-500 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2c333c] transition min-w-[120px]"
                                    >
                                        {repo.branches && repo.branches.length > 0 ? (
                                            repo.branches.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))
                                        ) : (
                                            <option value="main">main</option>
                                        )}
                                    </select>
                                    <svg className="w-4 h-4 absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                                    {repo.branches ? repo.branches.length : 1} branches
                                </span>

                                {/* Branch Management Controls */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            const name = prompt("Enter new branch name (based on " + selectedBranch + "):");
                                            if (name) createBranch(name);
                                        }}
                                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded rounded-md transition"
                                        title="Create new branch"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                    {selectedBranch !== repo.defaultBranch && (
                                        <button
                                            onClick={() => {
                                                if (confirm(`Delete branch '${selectedBranch}'? This cannot be undone.`)) deleteBranch(selectedBranch);
                                            }}
                                            className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                                            title="Delete current branch"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-full md:w-auto md:max-w-xs flex-1">
                                <input
                                    type="text"
                                    placeholder="Go to file..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md px-3 py-1.5 pl-8 text-sm outline-none focus:border-blue-500 transition-colors"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                            </div>
                        </div>

                        {/* Commit Info Bar */}
                        <div className="bg-gray-100 dark:bg-[#161b22] border dark:border-github-border border-gray-200 rounded-t-md p-3 flex justify-between items-center transition-colors">
                            <div className="flex items-center gap-2 pl-2">
                                <img
                                    src={repo.owner.avatarUrl || "https://github.com/github.png"}
                                    alt="Owner"
                                    className="w-5 h-5 rounded-full"
                                />
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{repo.owner.username}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">•</span>
                                <span className="truncate max-w-[300px] text-gray-700 dark:text-gray-300">{currentCommit?.message || 'Initial commit'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pr-2">
                                <span className="font-mono">{currentCommit?.hash.substring(0, 7)}</span>
                                <span>{new Date(currentCommit?.timestamp).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{currentCommit ? Math.floor((new Date() - new Date(currentCommit.timestamp)) / (1000 * 60 * 60 * 24)) : 0} days ago</span>
                                </div>
                            </div>
                        </div>

                        {/* File List */}
                        <div className="border-x border-b dark:border-github-border border-gray-200 rounded-b-md overflow-hidden bg-white dark:bg-[#0d1117] transition-colors">
                            {tree.length === 0 ? (
                                <div className="p-6 text-gray-500 dark:text-gray-300">
                                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Quick setup — if you’ve done this kind of thing before</h3>
                                    <div className="bg-gray-50 dark:bg-[#161b22] border dark:border-github-border border-gray-300 rounded-md p-4 mb-6">
                                        <h4 className="font-bold text-sm mb-2 text-gray-600 dark:text-gray-400">...or create a new repository on the command line</h4>
                                        <pre className="text-sm font-mono bg-gray-100 dark:bg-[#0d1117] p-3 rounded-md overflow-x-auto text-gray-800 dark:text-gray-300 border dark:border-gray-800 border-gray-200">
                                            {`echo "# ${repo.name}" >> README.md
codehub init
codehub add README.md
codehub commit -m "first commit"
codehub remote http://localhost:5173/${username}/${repoName}
codehub push`}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200 dark:divide-[#21262d]">
                                    {filteredTree.length === 0 ? (
                                        <li className="p-4 text-center text-gray-500 text-sm">No matching files found.</li>
                                    ) : (
                                        filteredTree.map((file) => (
                                            <li
                                                key={file.path}
                                                onClick={() => handleFileClick(file)}
                                                className="p-2.5 hover:bg-gray-50 dark:hover:bg-[#161b22] transition flex items-center justify-between gap-3 cursor-pointer text-sm group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline">{file.path}</span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400">
                                                    {timeAgo(file.lastModified || currentCommit?.timestamp)}
                                                </span>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            )}
                        </div>

                        {/* Readme (Placeholder) */}
                        {tree.length > 0 && (
                            <div className="mt-8 border dark:border-github-border border-gray-200 rounded-md">
                                <div className="bg-gray-100 dark:bg-[#161b22] p-2 border-b dark:border-github-border border-gray-200 font-bold text-sm px-4 text-gray-900 dark:text-white">README.md</div>
                                <div className="p-8 prose dark:prose-invert max-w-none bg-white dark:bg-[#0d1117] rounded-b-md">
                                    <h1>{repo.name}</h1>
                                    <p>{repo.description}</p>
                                    <p><em>(Readme rendering to be implemented)</em></p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Clone, details) */}
                    <div className="w-full md:w-80 flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#161b22] p-4 rounded-md border dark:border-github-border border-gray-200 shadow-sm">
                            <h3 className="font-bold mb-2 text-sm text-gray-900 dark:text-white">About</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{repo.description || "No description."}</p>

                            <div className="flex flex-col gap-2 mb-4">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Branches</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{repo.branches ? repo.branches.length : 1}</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Clone this repository</div>
                                <div className="flex mb-3">
                                    <input
                                        readOnly
                                        value={`codehub clone http://localhost:5173/${username}/${repoName}`}
                                        className="bg-gray-50 dark:bg-[#0d1117] text-gray-800 dark:text-gray-300 text-xs p-2 rounded-l-md border-y border-l dark:border-github-border border-gray-300 w-full outline-none font-mono"
                                    />
                                    <button onClick={copyCloneCommand} className="bg-gray-100 dark:bg-[#21262d] border dark:border-github-border border-gray-300 border-l-0 rounded-r-md px-2 hover:bg-gray-200 dark:hover:bg-[#30363d] transition">
                                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    </button>
                                </div>

                                <a
                                    href={`http://localhost:5000/api/repos/${repo._id}/download?branch=${selectedBranch}&token=${localStorage.getItem('token')}`}
                                    className="w-full flex items-center justify-center gap-2 bg-[#238636] hover:bg-[#2ea043] text-white py-1.5 rounded-md text-sm font-semibold transition"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" /> Download ZIP
                                </a>
                            </div>
                        </div>
                        <div className="text-right">
                            <button
                                onClick={handleReport}
                                className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 ml-auto"
                            >
                                <ShieldCheckIcon className="w-3 h-3" />
                                Report content
                            </button>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'pull-requests' ? (
                <div>
                    {prView === 'list' && (
                        <PullRequestList
                            repoId={repo._id}
                            onCreate={() => setPrView('create')}
                            onSelect={(id) => { setSelectedPrId(id); setPrView('detail'); }}
                        />
                    )}
                    {prView === 'create' && (
                        <NewPullRequest
                            repo={repo}
                            onCancel={() => setPrView('list')}
                            onSuccess={() => setPrView('list')}
                        />
                    )}
                    {prView === 'detail' && (
                        <PullRequestDetail
                            prId={selectedPrId}
                            onBack={() => setPrView('list')}
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
}
