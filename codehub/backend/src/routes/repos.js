const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');
const auth = require('../middleware/auth');

// @route   POST api/repos
// @desc    Create a new repository
// @access  Private
router.post('/', auth, repoController.createRepo);

// @route   GET api/repos/user
// @desc    Get current user's repositories
// @access  Private
router.get('/user', auth, repoController.getUserRepos);

// @route   GET api/repos/:repoId/download
// @desc    Download repository as ZIP
// @access  Public (Access control inside)
router.get('/:repoId/download', repoController.downloadRepoZip);

// @route   GET api/repos/:username/:repoName
// @desc    Get repository details
// @access  Public (Partial) - we will apply auth check inside controller for private repos
// Note: We might want an optional auth middleware here to identify the user if they ARE logged in
router.get('/:username/:repoName', repoController.getRepoByName);

// @route   POST api/repos/:repoId/push
// @desc    Push commits and objects
// @access  Private
router.post('/:repoId/push', auth, repoController.pushUpdates);

// @route   GET api/repos/:repoId/blob/:hash
// @desc    Get file content
// @access  Public (should optionally assign access control)
router.get('/:repoId/blob/:hash', repoController.getFileContent);

// @route   GET api/repos/:repoId/commits
// @desc    Get commit history
// @access  Public (Access control inside)
router.get('/:repoId/commits', repoController.getCommits);

// @route   DELETE api/repos/:repoId

// @route   DELETE api/repos/:repoId
// @desc    Delete a repository
// @access  Private
router.delete('/:repoId', auth, repoController.deleteRepo);

// Fork a repo
router.post('/:repoId/fork', auth, repoController.forkRepo);

// Branch Management
router.post('/:repoId/branches', auth, repoController.createBranch);
router.delete('/:repoId/branches/:branchName', auth, repoController.deleteBranch);

// @route   POST api/repos/:repoId/file
// @desc    Update a file
// @access  Private
router.post('/:repoId/file', auth, repoController.updateFile);



module.exports = router;
