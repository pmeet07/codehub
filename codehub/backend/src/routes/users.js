const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, userController.updateProfile);

module.exports = router;
