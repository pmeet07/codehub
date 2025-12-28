const Repository = require('../models/Repository');
const User = require('../models/User');
const Commit = require('../models/Commit');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const archiver = require('archiver');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

exports.createRepo = async (req, res) => {
    try {
        const { name, description, isPrivate, language } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Repository name is required' });
        }

        const newRepo = new Repository({
            name,
            isPrivate,
            progLanguage: language || 'JavaScript',
            owner: req.user.id
        });

        const savedRepo = await newRepo.save();

        // Add repo to user's list
        await User.findByIdAndUpdate(req.user.id, {
            $push: { repositories: savedRepo._id }
        });

        res.status(201).json(savedRepo);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Repository name already exists for this user' });
        }
        res.status(500).json({ message: err.message });
    }
};

exports.getUserRepos = async (req, res) => {
    try {
        const repos = await Repository.find({ owner: req.user.id }).sort({ updatedAt: -1 });
        res.json(repos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRepoByName = async (req, res) => {
    try {
        const { username, repoName } = req.params;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const repo = await Repository.findOne({
            owner: user._id,
            name: repoName
        }).populate('owner', 'username avatarUrl').populate('headCommit');

        if (!repo) return res.status(404).json({ message: 'Repository not found' });

        // Check privacy
        if (repo.isPrivate) {
            if (!req.user || (req.user.id !== repo.owner.id)) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        // Determine which commit to show
        let targetCommit = repo.headCommit;
        const branchName = req.query.branch;

        if (branchName && repo.branches && repo.branches.get(branchName)) {
            const commitHash = repo.branches.get(branchName);
            targetCommit = await Commit.findOne({ hash: commitHash });
        } else if (!targetCommit && repo.branches && repo.defaultBranch) {
            // Fallback: If repo.headCommit is missing, try default branch
            const defaultHash = repo.branches.get(repo.defaultBranch);
            if (defaultHash) {
                targetCommit = await Commit.findOne({ hash: defaultHash });
            }
        }

        let tree = [];
        if (targetCommit) {
            const treeHash = targetCommit.treeHash;
            const storagePath = path.join(__dirname, '../../storage', repo._id.toString());
            try {
                const treeContent = await fs.readFile(path.join(storagePath, treeHash));
                tree = JSON.parse(treeContent);

                // --- Calculate File Last Modified Times (Basic Walk) ---
                // We will try to find the last commit time for each file
                // Limit depth to avoid timeout
                const MAX_DEPTH = 20;
                const fileDates = {}; // path -> date
                const itemsToResolve = new Set(tree.map(f => f.path));

                let current = targetCommit;
                let currentTreeLocal = tree;
                let depth = 0;

                while (current && itemsToResolve.size > 0 && depth < MAX_DEPTH) {
                    const commitDate = current.timestamp;

                    // If no parent, everything remaining was created/modified here
                    if (!current.parentHash) {
                        for (const p of itemsToResolve) {
                            fileDates[p] = commitDate;
                        }
                        break;
                    }

                    // Load Parent
                    const parent = await Commit.findOne({ repoId: repo._id, hash: current.parentHash });
                    if (!parent) break; // Should not happen if consistency maintained

                    // Load Parent Tree
                    let parentTree = [];
                    try {
                        const ptContent = await fs.readFile(path.join(storagePath, parent.treeHash));
                        parentTree = JSON.parse(ptContent);
                    } catch (e) { /* Parent tree missing? */ }

                    // Create lookup for parent tree hashes
                    const parentTreeMap = new Map();
                    parentTree.forEach(f => parentTreeMap.set(f.path, f.hash));

                    // Check files
                    for (const f of currentTreeLocal) {
                        if (!itemsToResolve.has(f.path)) continue;

                        const parentFileHash = parentTreeMap.get(f.path);
                        // If hash is different or didn't exist in parent, it was modified in CURRENT commit
                        if (parentFileHash !== f.hash) {
                            fileDates[f.path] = commitDate;
                            itemsToResolve.delete(f.path);
                        }
                    }

                    // Prepare for next iteration
                    current = parent;
                    currentTreeLocal = parentTree;
                    depth++;
                }

                // Fill remaining with oldest found date or just target date as fallback
                for (const path of itemsToResolve) {
                    fileDates[path] = current ? current.timestamp : targetCommit.timestamp;
                }

                // Inject into tree
                tree = tree.map(f => ({
                    ...f,
                    lastModified: fileDates[f.path] || targetCommit.timestamp
                }));

            } catch (e) {
                console.error("Failed to read tree object", e);
            }
        }

        // Return branch list for UI
        let branchList = (repo.branches && repo.branches.size > 0) ? Array.from(repo.branches.keys()) : [];
        if (branchList.length === 0) branchList = ['main'];

        res.json({ repo: { ...repo.toObject(), branches: branchList }, tree, currentCommit: targetCommit });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.downloadRepoZip = async (req, res) => {
    try {
        const { repoId } = req.params;
        const { branch, token } = req.query;

        // Manual Auth Check for Download Link
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded; // Matches auth middleware structure
            } catch (e) {
                // Invalid token, assume guest
            }
        }

        const repo = await Repository.findById(repoId);
        if (!repo) return res.status(404).json({ message: 'Repo not found' });

        // Check privacy access if necessary... (skipping for brevity, rely on middleware or check)
        if (repo.isPrivate && (!req.user || req.user.id !== repo.owner.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Find Commit
        let commitHash;
        if (branch) {
            commitHash = repo.branches.get(branch);
        } else {
            commitHash = repo.branches.get(repo.defaultBranch || 'main');
        }

        if (!commitHash) return res.status(404).json({ message: 'Branch/Commit not found' });

        const commit = await Commit.findOne({ repoId, hash: commitHash });
        if (!commit) return res.status(404).json({ message: 'Commit object missing' });

        // Load Tree
        const storagePath = path.join(__dirname, '../../storage', repoId);
        const treePath = path.join(storagePath, commit.treeHash);

        if (!fs.existsSync(treePath)) return res.status(404).json({ message: 'Tree missing' });

        const tree = JSON.parse(await fs.readFile(treePath));

        // Prepare Archive
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        res.attachment(`${repo.name}-${branch || 'main'}.zip`);

        archive.pipe(res);

        // Append files
        // Note: Tree is flat. For true recursion we'd need hierarchical handling, 
        // but our system uses flat paths (e.g., "src/index.js")
        for (const file of tree) {
            if (file.type === 'blob') {
                const filePath = path.join(storagePath, file.hash);
                if (fs.existsSync(filePath)) {
                    // We need to decompress! Our storage stores Zlib or Raw? 
                    // Controller logic says `zlib.inflateSync`. 
                    // Ideally we should stream. 
                    const fileContent = await fs.readFile(filePath);
                    let finalBuffer;
                    try {
                        const decompressed = zlib.inflateSync(fileContent);
                        // Strip header
                        const nullIndex = decompressed.indexOf(0);
                        if (nullIndex !== -1 && nullIndex < 50) {
                            finalBuffer = decompressed.slice(nullIndex + 1);
                        } else {
                            finalBuffer = decompressed;
                        }
                    } catch (e) {
                        finalBuffer = fileContent; // Fallback
                    }

                    archive.append(finalBuffer, { name: file.path });
                }
            }
        }

        await archive.finalize();

    } catch (err) {
        console.error("Zip Error:", err);
        if (!res.headersSent) res.status(500).json({ message: "Failed to generate ZIP" });
    }
};

exports.getFileContent = async (req, res) => {
    try {
        const { repoId, hash } = req.params;
        const storagePath = path.join(__dirname, '../../storage', repoId, hash);

        if (!fs.existsSync(storagePath)) {
            return res.status(404).json({ message: 'File blob not found' });
        }

        const fileBuffer = await fs.readFile(storagePath);

        // Try to decompress (assuming Zlib if it looks like binary/git object)
        try {
            const zlib = require('zlib');
            const decompressed = zlib.inflateSync(fileBuffer);

            // If decompressed successfully, check for "blob <size>\0" header commonly used in git
            // We want to return the actual content, not the header.
            // We search for the first null byte.
            const nullIndex = decompressed.indexOf(0);
            let contentBuffer = decompressed;

            if (nullIndex !== -1 && nullIndex < 50) { // Header usually short
                const header = decompressed.slice(0, nullIndex).toString('utf-8');
                if (header.startsWith('blob')) {
                    contentBuffer = decompressed.slice(nullIndex + 1);
                }
            }

            // --- Encoding Detection & Conversion ---
            // Helper to detect and decode
            const decodeBuffer = (buf) => {
                // 1. Check Unicode BOMs
                if (buf.length >= 2) {
                    if (buf[0] === 0xFF && buf[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
                    if (buf[0] === 0xFE && buf[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf);
                }

                // 2. Heuristic for UTF-16 LE (no BOM): "h\0e\0l\0l\0o\0"
                let nullsAtOdd = 0;
                let checkLen = Math.min(buf.length, 100);
                for (let i = 0; i < checkLen; i += 2) {
                    if (i + 1 < buf.length && buf[i + 1] === 0) nullsAtOdd++;
                }

                if (checkLen > 0 && (nullsAtOdd / (checkLen / 2)) > 0.8) {
                    return new TextDecoder('utf-16le').decode(buf);
                }

                // Detect and strip UTF-8 BOM if present
                if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
                    return new TextDecoder('utf-8').decode(buf.slice(3));
                }
                return new TextDecoder('utf-8').decode(buf);
            };

            return res.send(decodeBuffer(contentBuffer));

        } catch (e) {
            // If decompression fails, it's likely plain text. Check encoding too.
            const decodeBuffer = (buf) => {
                if (buf.length >= 2) {
                    if (buf[0] === 0xFF && buf[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
                    if (buf[0] === 0xFE && buf[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf);
                }
                let nullsAtOdd = 0;
                let checkLen = Math.min(buf.length, 100);
                for (let i = 0; i < checkLen; i += 2) {
                    if (i + 1 < buf.length && buf[i + 1] === 0) nullsAtOdd++;
                }
                if (checkLen > 0 && (nullsAtOdd / (checkLen / 2)) > 0.8) {
                    return new TextDecoder('utf-16le').decode(buf);
                }
                return buf.toString('utf-8');
            };
            return res.send(decodeBuffer(fileBuffer));
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.pushUpdates = async (req, res) => {
    try {
        const { repoId } = req.params;
        const { commits, objects } = req.body;

        // Find repo by ID to ensure it exists and we have rights
        const repo = await Repository.findById(repoId);
        if (!repo) return res.status(404).send('Repo not found');

        if (repo.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: Only owner can push' });
        }

        // 1. Save all uploaded objects (Blobs/Trees) to server storage
        const storagePath = path.join(__dirname, '../../storage', repoId);
        await fs.ensureDir(storagePath);

        for (const obj of objects) {
            // Content is sent as Base64 to preserve binary integrity
            const buffer = Buffer.from(obj.content, 'base64');
            await fs.writeFile(path.join(storagePath, obj.hash), buffer);
        }

        // 2. Save Commits to DB
        let lastCommitHash = null;
        for (const commitData of commits) {
            // Prepare timestamp (ensure it's valid)
            const ts = commitData.timestamp ? new Date(commitData.timestamp) : new Date();

            // Check deduplication
            const exists = await Commit.findOne({ repoId, hash: commitData.hash });
            if (!exists) {
                const newCommit = new Commit({
                    repoId,
                    hash: commitData.hash, // The hash from client
                    message: commitData.message,
                    author: req.user.id,
                    treeHash: commitData.treeHash,
                    parentHash: commitData.parentHash,
                    timestamp: ts
                });
                await newCommit.save();
            }
            lastCommitHash = commitData.hash;
        }

        // 3. Update Repo HEAD & Branch
        if (lastCommitHash) {
            const headCommit = await Commit.findOne({ hash: lastCommitHash });

            // Default to 'main' if not provided
            const branchName = req.body.branch || 'main';
            if (!repo.branches) repo.branches = new Map();
            repo.branches.set(branchName, lastCommitHash);
            repo.markModified('branches'); // Important for Map types in Mongoose

            // If we are pushing to the default branch, also update headCommit for compatibility
            if (branchName === repo.defaultBranch) {
                repo.headCommit = headCommit._id;
            }

            await repo.save();
        }

        res.status(200).json({ success: true, head: lastCommitHash, branch: req.body.branch || 'main' });

    } catch (err) {
        console.error("Push Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.getCommits = async (req, res) => {
    try {
        const { repoId } = req.params;
        const { branch } = req.query;

        const repo = await Repository.findById(repoId);
        if (!repo) return res.status(404).json({ message: 'Repo not found' });

        // Privacy check
        if (repo.isPrivate && (!req.user || req.user.id !== repo.owner.toString())) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Determine head
        let headHash;
        if (branch) {
            headHash = repo.branches.get(branch);
        } else {
            headHash = repo.branches.get(repo.defaultBranch || 'main');
        }

        if (!headHash) return res.json([]); // No commits yet

        // Walk history
        const commits = [];
        let currentHash = headHash;
        const LIMIT = 100; // Limit history depth

        // Optimization: Fetch all commits for this repo in one go and build map?
        // Or fetch one by one? Fetching all is better for DB if repo isn't huge.
        // For now, let's just fetch all repo commits and reconstruct in memory.

        const allRepoCommits = await Commit.find({ repoId })
            .populate('author', 'username avatarUrl')
            .sort({ timestamp: -1 })
            .lean();

        const commitMap = new Map();
        allRepoCommits.forEach(c => commitMap.set(c.hash, c));

        while (currentHash && commits.length < LIMIT) {
            const commit = commitMap.get(currentHash);
            if (!commit) break;

            commits.push(commit);
            currentHash = commit.parentHash;
        }

        res.json(commits);
    } catch (err) {
        console.error("Get Commits Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.deleteRepo = async (req, res) => {
    try {
        const { repoId } = req.params;

        const repo = await Repository.findById(repoId);
        if (!repo) return res.status(404).json({ message: 'Repository not found' });

        if (repo.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: You can only delete your own repositories' });
        }

        // Delete from DB
        await Repository.findByIdAndDelete(repoId);

        // Remove from User's repo list
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { repositories: repoId }
        });

        // Delete storage folder (optional, good for cleanup)
        const storagePath = path.join(__dirname, '../../storage', repoId);
        if (await fs.pathExists(storagePath)) {
            await fs.remove(storagePath);
        }

        res.json({ message: 'Repository deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.forkRepo = async (req, res) => {
    try {
        const { repoId } = req.params;
        const userId = req.user.id; // User doing the fork

        // 1. Find the repo to fork
        const originalRepo = await Repository.findById(repoId);
        if (!originalRepo) return res.status(404).json({ message: 'Repository not found' });

        // 2. Check if already forked (or user owns it)
        if (originalRepo.owner.toString() === userId) {
            return res.status(400).json({ message: 'You cannot fork your own repository' });
        }

        const existingFork = await Repository.findOne({
            owner: userId,
            forkedFrom: repoId
        });
        if (existingFork) {
            return res.status(400).json({ message: 'You already forked this repository' });
        }

        // 3. Create New Repository Entry
        const newRepoName = originalRepo.name; // Keep same name

        // Check for name collision in user's repos
        const nameCollision = await Repository.findOne({ owner: userId, name: newRepoName });
        if (nameCollision) {
            return res.status(400).json({ message: `You already have a repository named ${newRepoName}` });
        }

        const newRepo = new Repository({
            name: newRepoName,
            description: originalRepo.description,
            owner: userId,
            isPrivate: originalRepo.isPrivate,
            progLanguage: originalRepo.progLanguage || 'JavaScript',
            forkedFrom: originalRepo._id,
            defaultBranch: originalRepo.defaultBranch,
            branches: originalRepo.branches // Copy initial branch pointers
        });

        const savedRepo = await newRepo.save();

        // 4. Add to User's repo list
        await User.findByIdAndUpdate(userId, {
            $push: { repositories: savedRepo._id }
        });

        // 5. Copy Storage (Files)
        const sourceStoragePath = path.join(__dirname, '../../storage', repoId);
        const targetStoragePath = path.join(__dirname, '../../storage', savedRepo._id.toString());

        if (await fs.pathExists(sourceStoragePath)) {
            await fs.copy(sourceStoragePath, targetStoragePath);
        }

        // 6. Duplicate Commits (Database records)
        // We find all commits belonging to the original repo and clone them for the new repo
        const originalCommits = await Commit.find({ repoId: originalRepo._id });

        const newCommits = originalCommits.map(commit => ({
            repoId: savedRepo._id,
            hash: commit.hash,
            message: commit.message,
            author: commit.author, // Keep original author
            parentHash: commit.parentHash,
            treeHash: commit.treeHash,
            timestamp: commit.timestamp
        }));

        if (newCommits.length > 0) {
            await Commit.insertMany(newCommits);
        }

        // 7. Update headCommit pointer
        if (originalRepo.headCommit) {
            // We need to find the NEW commit object with the same hash
            const originalHead = await Commit.findById(originalRepo.headCommit);
            if (originalHead) {
                const newHead = await Commit.findOne({ repoId: savedRepo._id, hash: originalHead.hash });
                if (newHead) {
                    savedRepo.headCommit = newHead._id;
                    await savedRepo.save();
                }
            }
        }

        res.status(201).json(savedRepo);

    } catch (err) {
        console.error("Fork Error:", err);
        res.status(500).json({ message: err.message });
    }
};

exports.createBranch = async (req, res) => {
    try {
        const { repoId } = req.params;
        const { branchName, fromBranch } = req.body;

        const repo = await Repository.findById(repoId);
        if (!repo) return res.status(404).json({ message: 'Repository not found' });

        if (repo.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (repo.branches.has(branchName)) {
            return res.status(400).json({ message: 'Branch already exists' });
        }

        // Determine starting commit
        let startCommitHash;
        if (fromBranch) {
            startCommitHash = repo.branches.get(fromBranch);
        } else {
            // Default to HEAD of default branch
            startCommitHash = repo.branches.get(repo.defaultBranch);
        }

        if (!startCommitHash) {
            return res.status(400).json({ message: 'Source branch invalid or empty repo' });
        }

        repo.branches.set(branchName, startCommitHash);
        await repo.save();

        res.status(201).json({ message: 'Branch created', branches: repo.branches });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteBranch = async (req, res) => {
    try {
        const { repoId, branchName } = req.params;
        const repo = await Repository.findById(repoId);

        if (!repo) return res.status(404).json({ message: 'Repository not found' });
        if (repo.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (branchName === repo.defaultBranch) {
            return res.status(400).json({ message: 'Cannot delete default branch' });
        }

        if (!repo.branches.has(branchName)) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        repo.branches.delete(branchName);
        await repo.save();

        res.json({ message: 'Branch deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateFile = async (req, res) => {
    try {
        const { repoId } = req.params;
        const { branch, path: filePath, content, message } = req.body;
        const user = req.user;

        const repo = await Repository.findById(repoId);
        if (!repo) return res.status(404).json({ message: 'Repository not found' });

        if (repo.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: You can only edit your own repositories' });
        }

        // 1. Prepare Blob (with Git-like header)
        const contentBuffer = Buffer.from(content, 'utf-8');
        const header = `blob ${contentBuffer.length}\0`;
        const storeBuffer = Buffer.concat([Buffer.from(header), contentBuffer]);

        const shasum = crypto.createHash('sha1');
        shasum.update(storeBuffer);
        const blobHash = shasum.digest('hex');

        const storagePath = path.join(__dirname, '../../storage', repoId);
        await fs.ensureDir(storagePath);

        const compressed = zlib.deflateSync(storeBuffer);
        await fs.writeFile(path.join(storagePath, blobHash), compressed);

        // 2. Get Current Tree
        const branchName = branch || repo.defaultBranch || 'main';
        let currentCommitHash = repo.branches ? repo.branches.get(branchName) : null;

        let tree = [];
        let parentHash = null;

        if (currentCommitHash) {
            const headCommit = await Commit.findOne({ repoId, hash: currentCommitHash });
            if (headCommit) {
                parentHash = headCommit.hash;
                try {
                    const treeData = await fs.readFile(path.join(storagePath, headCommit.treeHash));
                    tree = JSON.parse(treeData);
                } catch (e) {
                    // Tree missing or invalid, start fresh
                }
            }
        }

        // 3. Update Tree (Flat structure assumption)
        const existingEntryIndex = tree.findIndex(f => f.path === filePath);
        const newEntry = {
            path: filePath,
            mode: '100644', // Regular file
            type: 'blob',
            hash: blobHash
        };

        if (existingEntryIndex >= 0) {
            tree[existingEntryIndex] = newEntry;
        } else {
            tree.push(newEntry);
        }

        // 4. Save New Tree
        const treeJson = JSON.stringify(tree);
        const treeHashSum = crypto.createHash('sha1');
        treeHashSum.update(treeJson);
        const treeHash = treeHashSum.digest('hex');

        await fs.writeFile(path.join(storagePath, treeHash), treeJson);

        // 5. Create Commit
        const commitData = {
            repoId,
            message: message || `Update ${filePath}`,
            author: user.id,
            parentHash,
            treeHash,
            timestamp: new Date()
        };

        // Generate a deterministic hash for the commit
        const commitStr = JSON.stringify(commitData) + Math.random().toString();
        const commitHash = crypto.createHash('sha1').update(commitStr).digest('hex');

        const newCommit = new Commit({
            ...commitData,
            hash: commitHash
        });

        await newCommit.save();

        // 6. Update Branch Reference
        if (!repo.branches) repo.branches = new Map();
        repo.branches.set(branchName, commitHash);

        if (branchName === repo.defaultBranch) {
            repo.headCommit = newCommit._id;
        }

        // Important: Mark map as modified
        repo.markModified('branches');
        await repo.save();

        res.json({ success: true, commit: newCommit, tree });

    } catch (err) {
        console.error("Update File Error:", err);
        res.status(500).json({ message: err.message });
    }
};
