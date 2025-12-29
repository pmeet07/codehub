const { User, Repository, PullRequest, AdminLog, SystemSetting, Report, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs-extra');
const path = require('path');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalRepos = await Repository.count();
        const privateRepos = await Repository.count({ where: { isPrivate: true } });
        const totalPRs = await PullRequest.count();

        // New users per day (Last 30 days usually)
        // using raw query for date formatting convenience across dialects or just simple group


        // Recent Users (Last 5)
        const recentUsers = await User.findAll({
            where: { role: { [Op.ne]: 'admin' } },
            order: [['createdAt', 'DESC']],
            limit: 5,
            attributes: ['id', 'username', 'email', 'createdAt', 'avatarUrl']
        });

        // Recent Logs (Last 5)
        const recentLogs = await AdminLog.findAll({
            order: [['timestamp', 'DESC']],
            limit: 5,
            include: [{ model: User, as: 'admin', attributes: ['username'] }]
        });

        res.json({
            stats: {
                totalUsers,
                totalRepos,
                privateRepos,
                publicRepos: totalRepos - privateRepos,
                totalPRs,
                aiUsage: {
                    dailyRequests: Math.floor(Math.random() * 50) + 10, // Mock
                    totalGeneratedLines: 15420,
                    estimatedCost: 0.15
                }
            },
            recentUsers,
            recentLogs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { role: { [Op.ne]: 'admin' } },
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.toggleBanUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot ban an admin' });
        }

        user.isBanned = !user.isBanned;
        await user.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: user.isBanned ? 'BAN_USER' : 'UNBAN_USER',
            targetId: user.id.toString(),
            details: { username: user.username },
            ipAddress: req.ip
        });

        res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, user });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.tempBanUser = async (req, res) => {
    try {
        const { durationDays } = req.body;
        const days = parseInt(durationDays);
        if (isNaN(days) || days <= 0) return res.status(400).json({ message: 'Invalid duration' });

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Cannot ban an admin' });

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);

        user.banExpiresAt = expiry;
        user.isBanned = false;
        await user.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'TEMP_BAN',
            targetId: user.id.toString(),
            details: { username: user.username, duration: days, expires: expiry },
            ipAddress: req.ip
        });

        res.json({ message: `User suspended for ${days} days`, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getRepositories = async (req, res) => {
    try {
        const repos = await Repository.findAll({
            include: [{ model: User, as: 'owner', attributes: ['username', 'email'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(repos);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteRepository = async (req, res) => {
    try {
        const repo = await Repository.findByPk(req.params.id);
        if (!repo) return res.status(404).json({ message: 'Repo not found' });

        // Delete from DB (Repo delete cascades usually, but here we just destroy repo)
        await repo.destroy();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'DELETE_REPO',
            targetId: repo.id,
            details: { name: repo.name, owner: repo.ownerId },
            ipAddress: req.ip
        });

        res.json({ message: 'Repository deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const logs = await AdminLog.findAll({
            include: [{ model: User, as: 'admin', attributes: ['username'] }],
            order: [['timestamp', 'DESC']],
            limit: 100
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteLog = async (req, res) => {
    try {
        const log = await AdminLog.findByPk(req.params.id);
        if (!log) return res.status(404).json({ message: 'Log not found' });

        await log.destroy();
        res.json({ message: 'Log deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.getConfig();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) settings = await SystemSetting.create({});

        // Update fields
        await settings.update(req.body);

        await AdminLog.create({
            adminId: req.user.id,
            action: 'UPDATE_SETTINGS',
            details: req.body,
            ipAddress: req.ip
        });

        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.findAll({
            include: [{ model: User, as: 'reporter', attributes: ['username', 'email'] }],
            order: [['createdAt', 'DESC']],
            raw: true,
            nest: true // nested objects for reporter
        });

        // Enriched Reports
        const enrichedReports = await Promise.all(reports.map(async (report) => {
            let targetDetails = null;

            if (report.targetType === 'repo') {
                const repo = await Repository.findByPk(report.targetId, {
                    include: [{ model: User, as: 'owner', attributes: ['username'] }]
                });
                if (repo) {
                    targetDetails = {
                        name: repo.name,
                        owner: repo.owner?.username,
                        description: repo.description,
                        isPrivate: repo.isPrivate
                    };
                }
            } else if (report.targetType === 'user') {
                const user = await User.findByPk(report.targetId);
                if (user) {
                    targetDetails = {
                        username: user.username,
                        email: user.email
                    };
                }
            }

            return { ...report, targetDetails };
        }));

        res.json(enrichedReports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.resolveReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.status = 'resolved';
        await report.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'RESOLVE_REPORT',
            targetId: report.id,
            details: { reason: report.reason },
            ipAddress: req.ip
        });

        res.json({ message: 'Report resolved', report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllPullRequests = async (req, res) => {
    try {
        const prs = await PullRequest.findAll({
            include: [
                { model: User, as: 'author', attributes: ['username'] },
                { model: Repository, as: 'repository', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(prs);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.forceClosePullRequest = async (req, res) => {
    try {
        const pr = await PullRequest.findByPk(req.params.id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        pr.status = 'closed';
        await pr.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'FORCE_CLOSE_PR',
            targetId: pr.id,
            details: { title: pr.title },
            ipAddress: req.ip
        });

        res.json({ message: 'PR Closed' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deletePullRequest = async (req, res) => {
    try {
        const pr = await PullRequest.findByPk(req.params.id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        await pr.destroy();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'DELETE_PR',
            targetId: pr.id,
            details: { title: pr.title },
            ipAddress: req.ip
        });

        res.json({ message: 'PR Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
