const mongoose = require('mongoose');

const CommitSchema = new mongoose.Schema({
    repoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: true,
        index: true
    },
    hash: {
        type: String,
        required: true,
        // unique: true // Removed global uniqueness to allow forks to have their own copies
    }, // SHA-256
    message: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentHash: {
        type: String,
        default: null
    }, // Linked list
    treeHash: {
        type: String,
        required: true
    }, // Reference to the file tree snapshot
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Ensure hash is unique per repository
CommitSchema.index({ repoId: 1, hash: 1 }, { unique: true });

module.exports = mongoose.model('Commit', CommitSchema);
