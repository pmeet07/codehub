const mongoose = require('mongoose');

const RepositorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9-_]+$/.test(v);
            },
            message: 'Repository name can only contain letters, numbers, hyphens, and underscores.'
        }
    },
    progLanguage: {
        type: String,
        default: 'JavaScript'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        maxLength: 500
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    branches: {
        type: Map,
        of: String, // Stores commit hash for each branch
        default: {}
    },
    defaultBranch: {
        type: String,
        default: 'main'
    },
    headCommit: { // We'll keep this as a cached pointer to default branch tip or deprecate it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Commit' // Points to the latest commit
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    stars: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    forkedFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique repo names per user
RepositorySchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Repository', RepositorySchema);
