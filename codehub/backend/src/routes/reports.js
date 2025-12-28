const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// POST /api/reports - Submit a new report
router.post('/', auth, reportController.createReport);

module.exports = router;
