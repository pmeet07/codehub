const PullRequest = require('../models/PullRequest');
const Repository = require('../models/Repository');
const Commit = require('../models/Commit');
const User = require('../models/User');
const fs = require('fs-extra');
const path = require('path');

exports.createPullRequest = async (req, res) => {
    try {
        const {
            title,
            description,
            sourceRepoId,
            targetRepoId,
            sourceBranch,
            targetBranch
        } = req.body;

        // Validation
        if (!sourceRepoId || !targetRepoId || !sourceBranch || !targetBranch || !title) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (sourceRepoId === targetRepoId && sourceBranch === targetBranch) {
            return res.status(400).json({ message: 'Source and target branch cannot be the same.' });
        }

        const sourceRepo = await Repository.findById(sourceRepoId);
        const targetRepo = await Repository.findById(targetRepoId);

        if (!sourceRepo || !targetRepo) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        // Calculate next PR number
        const lastPR = await PullRequest.findOne({ repository: targetRepoId }).sort({ number: -1 });
        const number = (lastPR && !isNaN(lastPR.number)) ? lastPR.number + 1 : 1;

        // Create PR
        const newPR = new PullRequest({
            title,
            number,
            description,
            repository: targetRepoId, // The repo receiving the PR
            sourceRepo: sourceRepoId,
            sourceBranch,
            targetBranch,
            author: req.user.id
        });

        const savedPR = await newPR.save();
        res.status(201).json(savedPR);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getPullRequests = async (req, res) => {
    try {
        const { repoId } = req.params;
        const { status } = req.query;

        const query = { repository: repoId };
        if (status) query.status = status;

        const prs = await PullRequest.find(query)
            .populate('author', 'username avatarUrl')
            .populate('sourceRepo', 'name owner')
            .sort({ createdAt: -1 });

        res.json(prs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPullRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const pr = await PullRequest.findById(id)
            .populate('author', 'username avatarUrl')
            .populate('repository') // Target
            .populate('sourceRepo');

        if (!pr) return res.status(404).json({ message: 'Pull request not found' });

        res.json(pr);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.mergePullRequest = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Merge] Starting merge for PR ${id}`);

        const pr = await PullRequest.findById(id);
        if (!pr) return res.status(404).json({ message: 'Pull request not found' });
        if (pr.status !== 'open') return res.status(400).json({ message: 'PR is not open' });

        const targetRepo = await Repository.findById(pr.repository);
        const sourceRepo = await Repository.findById(pr.sourceRepo);

        if (!targetRepo || !sourceRepo) return res.status(404).json({ message: 'Repository not found' });

        if (targetRepo.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // 1. Get Source Branch Head Commit
        const sourceHeadHash = sourceRepo.branches.get(pr.sourceBranch);
        if (!sourceHeadHash) return res.status(400).json({ message: 'Source branch not found' });

        // 2. Sync objects/commits
        const queue = [sourceHeadHash];
        const visited = new Set();

        const targetStoragePath = path.join(__dirname, '../../storage', targetRepo._id.toString());
        const sourceStoragePath = path.join(__dirname, '../../storage', sourceRepo._id.toString());
        await fs.ensureDir(targetStoragePath);

        while (queue.length > 0) {
            const currentHash = queue.pop();
            if (visited.has(currentHash)) continue;
            visited.add(currentHash);

            // Optimization: Skip if target already has this commit
            const targetCommitExists = await Commit.findOne({ repoId: targetRepo._id, hash: currentHash });
            if (targetCommitExists) continue;

            // Get Source Commit with Safe Fallback
            let sourceCommit = await Commit.findOne({ repoId: sourceRepo._id, hash: currentHash });
            if (!sourceCommit) sourceCommit = await Commit.findOne({ hash: currentHash }); // Global fallback

            if (!sourceCommit) {
                console.warn(`[Merge] Commit ${currentHash} missing from DB. Skipping.`);
                continue;
            }

            try {
                // Copy Commit Record
                const newCommit = new Commit({
                    repoId: targetRepo._id,
                    hash: sourceCommit.hash,
                    message: sourceCommit.message,
                    author: sourceCommit.author,
                    parentHash: sourceCommit.parentHash,
                    treeHash: sourceCommit.treeHash,
                    timestamp: sourceCommit.timestamp
                });
                await newCommit.save();

                // Copy Tree Object
                const sourceTreePath = path.join(sourceStoragePath, sourceCommit.treeHash);
                const targetTreePath = path.join(targetStoragePath, sourceCommit.treeHash);
                if (await fs.pathExists(sourceTreePath)) {
                    await fs.copy(sourceTreePath, targetTreePath);
                }
            } catch (innerErr) {
                console.error(`[Merge] Error copying commit ${currentHash}:`, innerErr);
                // Continue despite error to try best-effort merge
            }

            if (sourceCommit.parentHash) {
                queue.push(sourceCommit.parentHash);
            }
        }

        // Bulk Copy Blobs (Safety Net)
        try {
            await fs.copy(sourceStoragePath, targetStoragePath, { overwrite: false, errorOnExist: false });
        } catch (copyErr) {
            console.error("[Merge] Blob copy warning:", copyErr);
        }

        // 3. Update Target Repo Branch
        if (!targetRepo.branches) targetRepo.branches = new Map();
        targetRepo.branches.set(pr.targetBranch, sourceHeadHash);
        targetRepo.markModified('branches');

        if (pr.targetBranch === targetRepo.defaultBranch) {
            try {
                const headCommitObj = await Commit.findOne({ repoId: targetRepo._id, hash: sourceHeadHash });
                if (headCommitObj) targetRepo.headCommit = headCommitObj._id;
            } catch (err) {
                console.error("[Merge] Failed to update headCommit pointer:", err);
            }
        }

        await targetRepo.save();

        // 4. Update PR Status
        pr.status = 'merged';
        pr.mergedAt = Date.now();
        pr.mergedBy = req.user.id;
        await pr.save();

        console.log(`[Merge] PR ${id} merged successfully.`);
        res.json({ message: 'Pull request merged successfully', pr });

    } catch (err) {
        console.error("[Merge] Critical Failure:", err);
        res.status(500).json({ message: 'Merge failed: ' + err.message });
    }
};

exports.updatePullRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // closed

        const pr = await PullRequest.findById(id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        // Check auth (Author or Maintainer)
        // For simplicity: only Target Repo Owner can close for now, or Author?
        // Let's say author can close, or repo owner.
        const repo = await Repository.findById(pr.repository);
        if (pr.author.toString() !== req.user.id && repo.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        pr.status = status;
        await pr.save();
        res.json(pr);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
