const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// All routes here require admin privileges
router.use(adminAuth);

router.get('/dashboard', adminController.getDashboardStats);

router.get('/users', adminController.getUsers);
router.put('/users/:id/ban', adminController.toggleBanUser);
router.put('/users/:id/temp-ban', adminController.tempBanUser);

router.get('/repos', adminController.getRepositories);
router.delete('/repos/:id', adminController.deleteRepository);

router.get('/logs', adminController.getLogs);

// PR Moderation
router.get('/pull-requests', adminController.getAllPullRequests);
router.put('/pull-requests/:id/close', adminController.forceClosePullRequest);
router.delete('/pull-requests/:id', adminController.deletePullRequest);

// Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

router.get('/reports', adminController.getReports);
router.put('/reports/:id/resolve', adminController.resolveReport);

module.exports = router;
