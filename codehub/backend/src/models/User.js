const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: false
    },
    avatarUrl: {
        type: String,
        default: 'https://github.com/identicons/default.png' // Placeholder
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banExpiresAt: {
        type: Date,
        default: null
    },
    repositories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository'
    }],
    bio: String,
    location: String,
    website: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
