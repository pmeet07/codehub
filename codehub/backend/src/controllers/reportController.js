const Report = require('../models/Report');

exports.createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        // Basic Validation
        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const report = new Report({
            reporterId: req.user.id,
            targetType,
            targetId,
            reason,
            description
        });

        await report.save();
        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
