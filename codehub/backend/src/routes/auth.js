const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/google
// @desc    Google Login
// @access  Public
router.post('/google', authController.googleLogin);

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, authController.getCurrentUser);

module.exports = router;
