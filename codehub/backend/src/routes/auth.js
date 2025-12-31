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

// @route   POST api/auth/verify-account
// @desc    Verify new account
// @access  Public
router.post('/verify-account', authController.verifyAccount);

// @route   POST api/auth/resend-otp
// @desc    Resend verification OTP
// @access  Public
router.post('/resend-otp', authController.resendVerificationOtp);
router.post('/resend-login-otp', authController.resendLoginOtp);

// @route   POST api/auth/google
// @desc    Google Login
// @access  Public
router.post('/google', authController.googleLogin);

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, authController.getCurrentUser);

// 2FA Routes
router.post('/setup-2fa', auth, authController.setupTwoFactor);
router.post('/verify-2fa', auth, authController.verifyTwoFactor);
router.post('/disable-2fa', auth, authController.disableTwoFactor);
router.post('/login-2fa', authController.validateTwoFactorLogin);
router.post('/verify-email-login', authController.verifyEmailLogin);
router.post('/verify-login-any', authController.verifyAnyLogin);

module.exports = router;
