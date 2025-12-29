const { User } = require('../models');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, location, website, avatarUrl } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updates = {};
        if (bio !== undefined) updates.bio = bio;
        if (location !== undefined) updates.location = location;
        if (website !== undefined) updates.website = website;
        if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

        await user.update(updates);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                location: user.location,
                website: user.website,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
