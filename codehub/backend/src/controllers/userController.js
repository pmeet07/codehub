const User = require('../models/User');

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, location, website, avatarUrl } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (bio !== undefined) user.bio = bio;
        if (location !== undefined) user.location = location;
        if (website !== undefined) user.website = website;
        if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
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
