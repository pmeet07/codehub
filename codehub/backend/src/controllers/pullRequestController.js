const { PullRequest, Repository, Commit, User, Branch } = require('../models');
const fs = require('fs-extra');
const path = require('path');
const { Op } = require('sequelize');

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

        if (!sourceRepoId || !targetRepoId || !sourceBranch || !targetBranch || !title) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (sourceRepoId === targetRepoId && sourceBranch === targetBranch) {
            return res.status(400).json({ message: 'Source and target branch cannot be the same.' });
        }

        const sourceRepo = await Repository.findByPk(sourceRepoId);
        const targetRepo = await Repository.findByPk(targetRepoId);

        if (!sourceRepo || !targetRepo) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        // Calculate next PR number using max
        const lastPR = await PullRequest.findOne({
            where: { repositoryId: targetRepoId },
            order: [['number', 'DESC']]
        });
        const number = (lastPR && !isNaN(lastPR.number)) ? lastPR.number + 1 : 1;

        const newPR = await PullRequest.create({
            title,
            number,
            description,
            repositoryId: targetRepoId,
            sourceRepoId: sourceRepoId,
            sourceBranch,
            targetBranch,
            authorId: req.user.id
        });

        res.status(201).json(newPR);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getPullRequests = async (req, res) => {
    try {
        const { repoId } = req.params;
        const { status } = req.query;

        const where = { repositoryId: repoId };
        if (status) where.status = status;

        const prs = await PullRequest.findAll({
            where,
            include: [
                { model: User, as: 'author', attributes: ['username', 'avatarUrl'] },
                { model: Repository, as: 'sourceRepo', attributes: ['name', 'ownerId'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(prs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPullRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const pr = await PullRequest.findByPk(id, {
            include: [
                { model: User, as: 'author', attributes: ['username', 'avatarUrl'] },
                { model: Repository, as: 'repository' },
                { model: Repository, as: 'sourceRepo' }
            ]
        });

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

        const pr = await PullRequest.findByPk(id);
        if (!pr) return res.status(404).json({ message: 'Pull request not found' });
        if (pr.status !== 'open') return res.status(400).json({ message: 'PR is not open' });

        const targetRepo = await Repository.findByPk(pr.repositoryId);
        const sourceRepo = await Repository.findByPk(pr.sourceRepoId);

        if (!targetRepo || !sourceRepo) return res.status(404).json({ message: 'Repository not found' });

        if (targetRepo.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // 1. Get Source Branch Head Commit
        const sourceBranchRecord = await Branch.findOne({ where: { repoId: sourceRepo.id, name: pr.sourceBranch } });
        if (!sourceBranchRecord) return res.status(400).json({ message: 'Source branch not found' });
        const sourceHeadHash = sourceBranchRecord.commitHash;

        // 2. Sync objects/commits
        const queue = [sourceHeadHash];
        const visited = new Set();

        const targetStoragePath = path.join(__dirname, '../../storage', targetRepo.id.toString());
        const sourceStoragePath = path.join(__dirname, '../../storage', sourceRepo.id.toString());
        await fs.ensureDir(targetStoragePath);

        while (queue.length > 0) {
            const currentHash = queue.pop();
            if (visited.has(currentHash)) continue;
            visited.add(currentHash);

            const targetCommitExists = await Commit.findOne({ where: { repoId: targetRepo.id, hash: currentHash } });
            if (targetCommitExists) continue;

            let sourceCommit = await Commit.findOne({ where: { repoId: sourceRepo.id, hash: currentHash } });
            if (!sourceCommit) sourceCommit = await Commit.findOne({ where: { hash: currentHash } });

            if (!sourceCommit) {
                console.warn(`[Merge] Commit ${currentHash} missing from DB. Skipping.`);
                continue;
            }

            try {
                // Copy Commit Record
                await Commit.create({
                    repoId: targetRepo.id,
                    hash: sourceCommit.hash,
                    message: sourceCommit.message,
                    authorId: sourceCommit.authorId,
                    parentHash: sourceCommit.parentHash,
                    treeHash: sourceCommit.treeHash,
                    timestamp: sourceCommit.timestamp
                });

                // Copy Tree Object
                const sourceTreePath = path.join(sourceStoragePath, sourceCommit.treeHash);
                const targetTreePath = path.join(targetStoragePath, sourceCommit.treeHash);
                if (await fs.pathExists(sourceTreePath)) {
                    await fs.copy(sourceTreePath, targetTreePath);
                }
            } catch (innerErr) {
                console.error(`[Merge] Error copying commit ${currentHash}:`, innerErr);
            }

            if (sourceCommit.parentHash) {
                queue.push(sourceCommit.parentHash);
            }
        }

        // Bulk Copy Blobs
        try {
            await fs.copy(sourceStoragePath, targetStoragePath, { overwrite: false, errorOnExist: false });
        } catch (copyErr) {
            console.error("[Merge] Blob copy warning:", copyErr);
        }

        // 3. Update Target Repo Branch
        const [targetBranchRecord, created] = await Branch.findOrCreate({
            where: { repoId: targetRepo.id, name: pr.targetBranch },
            defaults: { commitHash: sourceHeadHash }
        });

        if (!created) {
            targetBranchRecord.commitHash = sourceHeadHash;
            await targetBranchRecord.save();
        }

        if (pr.targetBranch === targetRepo.defaultBranch) {
            try {
                const headCommitObj = await Commit.findOne({ where: { repoId: targetRepo.id, hash: sourceHeadHash } });
                if (headCommitObj) {
                    targetRepo.headCommitId = headCommitObj.id;
                    await targetRepo.save();
                }
            } catch (err) {
                console.error("[Merge] Failed to update headCommit pointer:", err);
            }
        }

        // 4. Update PR Status
        pr.status = 'merged';
        pr.mergedAt = new Date();
        pr.mergedById = req.user.id;
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
        const { status } = req.body;

        const pr = await PullRequest.findByPk(id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        const repo = await Repository.findByPk(pr.repositoryId);
        // Only author or repo owner can close
        if (pr.authorId !== req.user.id && repo.ownerId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        pr.status = status;
        await pr.save();
        res.json(pr);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
