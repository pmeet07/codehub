const mongoose = require('mongoose');

const PullRequestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    status: {
        type: String,
        enum: ['open', 'closed', 'merged'],
        default: 'open'
    },
    number: {
        type: Number,
        required: true
    },
    repository: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    sourceRepo: { // The repository coming FROM (could be a fork)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        default: null // If null, means same repo
    },
    sourceBranch: {
        type: String,
        required: true
    },
    targetBranch: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    mergedAt: {
        type: Date
    },
    mergedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Ensure unique PR number per repo
PullRequestSchema.index({ repository: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('PullRequest', PullRequestSchema);
