const { Repository, User } = require('../models');
const { Op } = require('sequelize');

exports.searchRepositories = async (req, res) => {
    try {
        const { q, language, sort } = req.query;

        let where = { isPrivate: false };

        if (q && q.trim().length > 0) {
            // Case insensitive search
            const searchTerm = `%${q.trim()}%`;
            where[Op.or] = [
                { name: { [Op.iLike]: searchTerm } },
                { description: { [Op.iLike]: searchTerm } }
            ];
        }

        if (language) {
            where.progLanguage = language;
        }

        let order = [['createdAt', 'DESC']];
        if (sort === 'stars') {
            // Assuming we have a virtual count or separate sort logic, but for now fallback to created
            // Implementing sort by related 'stars' count is complex in simple query without aggregations
            // We'll stick to basic sort or standard usage
        }

        const repos = await Repository.findAll({
            where,
            include: [{ model: User, as: 'owner', attributes: ['username', 'avatarUrl'] }],
            order: order,
            limit: 50
        });

        res.json(repos);
    } catch (err) {
        console.error("Search Error", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllPublicRepos = async (req, res) => {
    try {
        const repos = await Repository.findAll({
            where: { isPrivate: false },
            include: [{ model: User, as: 'owner', attributes: ['username', 'avatarUrl'] }],
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(repos);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
