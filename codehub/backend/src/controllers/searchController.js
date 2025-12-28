const Repository = require('../models/Repository');
const User = require('../models/User');

// Utility to escape regex characters
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

exports.searchRepositories = async (req, res) => {
    try {
        const { q, language, sort } = req.query; // q = query string

        let query = { isPrivate: false }; // Only public repos

        if (q && q.trim().length > 0) {
            const regex = new RegExp(escapeRegex(q), 'gi'); // Global, Case-insensitive
            query.$or = [
                { name: regex },
                { description: regex }
            ];
        }

        if (language) {
            query.progLanguage = language;
        }

        let sortOption = { createdAt: -1 }; // Default: Newest
        if (sort === 'stars') {
            sortOption = { stars: -1 };
        } else if (sort === 'forks') {
            // Depending on how forks are tracked (via query/count or field)
            // MVP: just sort by createdAt
        }

        const repos = await Repository.find(query)
            .populate('owner', 'username avatarUrl')
            .sort(sortOption)
            .limit(50);

        res.json(repos);
    } catch (err) {
        console.error("Search Error", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllPublicRepos = async (req, res) => {
    try {
        const repos = await Repository.find({ isPrivate: false })
            .populate('owner', 'username avatarUrl')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(repos);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
