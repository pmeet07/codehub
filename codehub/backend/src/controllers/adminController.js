const User = require('../models/User');
const Repository = require('../models/Repository');
const PullRequest = require('../models/PullRequest'); // Import
const AdminLog = require('../models/AdminLog');
const SystemSetting = require('../models/SystemSetting');
const Report = require('../models/Report');
const fs = require('fs-extra');
const path = require('path');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRepos = await Repository.countDocuments();
        const privateRepos = await Repository.countDocuments({ isPrivate: true });
        const totalPRs = await PullRequest.countDocuments(); // Added stats

        // Example Aggregation: New users per day
        const usersOverTime = await User.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Recent Users (Last 5)
        const recentUsers = await User.find({ role: { $ne: 'admin' } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username email createdAt avatarUrl');

        // Recent Logs (Last 5)
        const recentLogs = await AdminLog.find()
            .sort({ timestamp: -1 })
            .limit(5)
            .populate('adminId', 'username');

        res.json({
            stats: {
                totalUsers,
                totalRepos,
                privateRepos,
                publicRepos: totalRepos - privateRepos,
                totalPRs,
                aiUsage: {
                    dailyRequests: Math.floor(Math.random() * 50) + 10, // Mock for demo
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
        // Exclude admins from the list so they can't ban themselves/others via UI
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.toggleBanUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent banning self or other admins
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot ban an admin' });
        }

        user.isBanned = !user.isBanned;
        await user.save();

        // 3. Log Action
        await AdminLog.create({
            adminId: req.user.id,
            action: user.isBanned ? 'BAN_USER' : 'UNBAN_USER',
            targetId: user._id.toString(),
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

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Cannot ban an admin' });

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);

        user.banExpiresAt = expiry;
        user.isBanned = false; // Reset permanent ban
        await user.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'TEMP_BAN',
            targetId: user._id.toString(),
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
        const repos = await Repository.find()
            .populate('owner', 'username email')
            .sort({ createdAt: -1 });
        res.json(repos);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteRepository = async (req, res) => {
    try {
        const repo = await Repository.findById(req.params.id);
        if (!repo) return res.status(404).json({ message: 'Repo not found' });

        // Delete from DB
        await Repository.findByIdAndDelete(req.params.id);

        // Audit Log
        await AdminLog.create({
            adminId: req.user.id,
            action: 'DELETE_REPO',
            targetId: repo._id,
            details: { name: repo.name, owner: repo.owner },
            ipAddress: req.ip
        });

        res.json({ message: 'Repository deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getLogs = async (req, res) => {
    try {
        const logs = await AdminLog.find()
            .populate('adminId', 'username')
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    } catch (err) {
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
        if (!settings) settings = new SystemSetting();

        Object.assign(settings, req.body);
        settings.updatedAt = Date.now();
        await settings.save();

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
        const reports = await Report.find()
            .populate('reporterId', 'username email')
            .sort({ createdAt: -1 })
            .lean();

        // Enriched Reports with Target Details
        const enrichedReports = await Promise.all(reports.map(async (report) => {
            let targetDetails = null;

            if (report.targetType === 'repo') {
                const repo = await Repository.findById(report.targetId).populate('owner', 'username');
                if (repo) {
                    targetDetails = {
                        name: repo.name,
                        owner: repo.owner?.username,
                        description: repo.description,
                        isPrivate: repo.isPrivate
                    };
                }
            } else if (report.targetType === 'user') {
                const user = await User.findById(report.targetId);
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
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.status = 'resolved';
        await report.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'RESOLVE_REPORT',
            targetId: report._id,
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
        const prs = await PullRequest.find()
            .populate('author', 'username')
            .populate('repository', 'name')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(prs);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.forceClosePullRequest = async (req, res) => {
    try {
        const pr = await PullRequest.findById(req.params.id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        pr.status = 'closed';
        await pr.save();

        await AdminLog.create({
            adminId: req.user.id,
            action: 'FORCE_CLOSE_PR',
            targetId: pr._id,
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
        const pr = await PullRequest.findById(req.params.id);
        if (!pr) return res.status(404).json({ message: 'PR not found' });

        await PullRequest.findByIdAndDelete(req.params.id);

        await AdminLog.create({
            adminId: req.user.id,
            action: 'DELETE_PR',
            targetId: pr._id,
            details: { title: pr.title },
            ipAddress: req.ip
        });

        res.json({ message: 'PR Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
