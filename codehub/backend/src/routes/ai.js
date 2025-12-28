const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// @route   POST api/ai/explain
// @desc    Explain code using AI
// @access  Public
router.post('/explain', aiController.explainCode);

// @route   POST api/ai/debug
// @desc    Debug code and find bugs using AI
// @access  Public
router.post('/debug', aiController.debugCode);

module.exports = router;
