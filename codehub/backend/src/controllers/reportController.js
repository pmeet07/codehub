const { Report } = require('../models');

exports.createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        // Basic Validation
        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const report = await Report.create({
            reporterId: req.user.id,
            targetType,
            targetId,
            reason,
            // description: description // if schema has description, but model didn't have it in my rewrite?
            // checking Report model... I only added reason. Original mongo had reason.
            // Wait, original mongo file: reason: String.
            // View file output step 23: ReportSchema... reason, status, targetId... no description?
            // But controller uses description.
            // I'll stick to reason. If description is needed I should add it to model.
            // I'll assume reason covers it or append.
            reason: description ? `${reason} - ${description}` : reason
        });

        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
