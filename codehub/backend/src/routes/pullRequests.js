const express = require('express');
const router = express.Router();
const pullRequestController = require('../controllers/pullRequestController');
const auth = require('../middleware/auth');

// Create a new PR
router.post('/', auth, pullRequestController.createPullRequest);

// List PRs for a repo
// GET /api/pull-requests/repo/:repoId
router.get('/repo/:repoId', pullRequestController.getPullRequests);

// Get single PR
router.get('/:id', pullRequestController.getPullRequestById);

// Merge PR
router.post('/:id/merge', auth, pullRequestController.mergePullRequest);

// Update Status (Close/Reopen)
router.put('/:id/status', auth, pullRequestController.updatePullRequestStatus);

// Get PR Commits
router.get('/:id/commits', auth, pullRequestController.getPullRequestCommits);

// Get PR Files
router.get('/:id/files', auth, pullRequestController.getPullRequestFiles);

module.exports = router;
