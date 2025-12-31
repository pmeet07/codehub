const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

        let user = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
        if (user) {
            // If user exists but is NOT verified, we could resend OTP. 
            // For now, let's just say "User already exists".
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP for Email Verification
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000); // 10 mins expiry
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Create User (Unverified)
        user = await User.create({
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            loginOtp: hashedOtp,
            loginOtpExpires: otpExpires
        });

        // Send Email
        const emailSent = await emailService.sendOTP(user.email, otp);

        res.status(201).json({
            message: 'Registration successful. Please verify your email.',
            userId: user.id,
            email: user.email,
            requiresVerification: true,
            devOtp: emailSent ? null : otp // If email failed (dev mode), return OTP
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.verifyAccount = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        if (!user.loginOtp || !user.loginOtpExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        if (new Date() > user.loginOtpExpires) {
            return res.status(400).json({ message: 'OTP Expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.loginOtp);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

        // Mark Verified & Clear OTP
        await User.update({
            isVerified: true,
            loginOtp: null,
            loginOtpExpires: null
        }, { where: { id: user.id } });

        // Generate Token
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resendVerificationOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60000);
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        await User.update({ loginOtp: hashedOtp, loginOtpExpires: otpExpires }, { where: { id: user.id } });

        const emailSent = await emailService.sendOTP(user.email, otp);

        res.json({ message: 'New OTP sent to email', devOtp: emailSent ? null : otp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resendLoginOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate new OTP regardless of verified status (for Login/2FA)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60000); // 5 mins
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        await User.update({ loginOtp: hashedOtp, loginOtpExpires: otpExpires }, { where: { id: user.id } });

        const emailSent = await emailService.sendOTP(user.email, otp);

        res.json({ message: 'New login code sent to email', devOtp: emailSent ? null : otp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        if (user.isBanned) return res.status(403).json({ message: 'Banned' });

        // If user has no password (e.g. Google Login only), initiate Email OTP flow
        if (!user.password) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 5 * 60000); // 5 mins

            const salt = await bcrypt.genSalt(10);
            const hashedOtp = await bcrypt.hash(otp, salt);

            await User.update({ loginOtp: hashedOtp, loginOtpExpires: otpExpires }, { where: { id: user.id } });

            // Send Email
            const emailSent = await emailService.sendOTP(user.email, otp);
            const isEmailConfigured = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your-email');

            return res.json({
                message: '2FA required',
                userId: user.id,
                email: user.email,
                method: 'email',
                devOtp: emailSent ? null : otp,
                emailConfigured: isEmailConfigured
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified) {
            return res.status(403).json({
                message: 'Email not verified',
                requiresVerification: true,
                email: user.email,
                userId: user.id
            });
        }

        // 2FA Check (Authenticator Priority)
        if (user.isTwoFactorEnabled) {
            // Generate & Send Backup Email OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 5 * 60000); // 5 mins
            const salt = await bcrypt.genSalt(10);
            const hashedOtp = await bcrypt.hash(otp, salt);

            await User.update({ loginOtp: hashedOtp, loginOtpExpires: otpExpires }, { where: { id: user.id } });
            await emailService.sendOTP(user.email, otp);

            return res.json({ message: '2FA required', userId: user.id, isTwoFactorEnabled: true, method: 'authenticator' });
        }

        // Force Email OTP for Admins if 2FA is NOT enabled
        if (user.role === 'admin') {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 5 * 60000); // 5 mins

            const salt = await bcrypt.genSalt(10);
            const hashedOtp = await bcrypt.hash(otp, salt);

            await User.update({ loginOtp: hashedOtp, loginOtpExpires: otpExpires }, { where: { id: user.id } });

            // Send Email
            const emailSent = await emailService.sendOTP(user.email, otp);
            const isEmailConfigured = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your-email');

            return res.json({
                message: '2FA required',
                userId: user.id,
                email: user.email,
                method: 'email',
                devOtp: emailSent ? null : otp,
                emailConfigured: isEmailConfigured
            });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = await User.findOne({ where: { email } });
        if (user) {
            if (user.isBanned) return res.status(403).json({ message: 'Banned' });
            if (!user.googleId) { user.googleId = payload.sub; if (!user.avatarUrl) user.avatarUrl = picture; await user.save(); }

            // Mark as verified if using Google
            if (!user.isVerified) await User.update({ isVerified: true }, { where: { id: user.id } });

            // 2FA Checks
            if (user.isTwoFactorEnabled) {
                // Generate & Send Backup Email OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpires = new Date(Date.now() + 5 * 60000); // 5 mins
                const salt = await bcrypt.genSalt(10);
                const hashedOtp = await bcrypt.hash(otp, salt);

                await User.update({ loginOtp: hashedOtp, loginOtpExpires: otpExpires }, { where: { id: user.id } });
                await emailService.sendOTP(user.email, otp);

                return res.json({ message: '2FA required', userId: user.id, isTwoFactorEnabled: true, method: 'authenticator' });
            }

            // Force Email OTP for Admins if 2FA is NOT enabled
            if (user.role === 'admin') {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpires = new Date(Date.now() + 5 * 60000); // 5 mins
                const salt = await bcrypt.genSalt(10);
                const hashedOtp = await bcrypt.hash(otp, salt);

                await User.update({ loginOtp: hashedOtp, loginOtpExpires: otpExpires }, { where: { id: user.id } });

                // Send Email
                const emailSent = await emailService.sendOTP(user.email, otp);
                const isEmailConfigured = process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your-email');

                return res.json({
                    message: '2FA required',
                    userId: user.id,
                    email: user.email,
                    method: 'email',
                    devOtp: emailSent ? null : otp,
                    emailConfigured: isEmailConfigured
                });
            }

            // Standard User Login (Successful)
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });

        } else {
            user = await User.create({
                username: name || email.split('@')[0],
                email,
                googleId: payload.sub,
                avatarUrl: picture,
                isVerified: true // Google accounts start verified
            });
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Google login failed' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.setupTwoFactor = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const secret = speakeasy.generateSecret({ name: `CodeHub (${user.email})` });
        const url = await qrcode.toDataURL(secret.otpauth_url);

        await User.update({ twoFactorSecret: secret.base32 }, { where: { id: user.id } });

        console.log(`[2FA Setup] Secret updated for user ${user.email}`);

        res.json({ secret: secret.base32, qrcode: url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.verifyTwoFactor = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user.twoFactorSecret) return res.status(400).json({ message: 'No setup found. Restart setup.' });

        console.log(`[2FA Verify] Secret: ${user.twoFactorSecret}, Token: ${token}`);

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 6 // +/- 3 min tolerance
        });

        if (verified) {
            const recoveryCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
            await User.update({ isTwoFactorEnabled: true, recoveryCodes }, { where: { id: user.id } });
            res.json({ message: '2FA Enabled', recoveryCodes });
        } else {
            console.log('[2FA Verify] Failed.');
            res.status(400).json({ message: 'Invalid code. Ensure you scanned the NEWEST QR code.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.validateTwoFactorLogin = async (req, res) => {
    try {
        const { userId, token, isRecovery } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let verified = false;
        if (isRecovery) {
            const codes = user.recoveryCodes || [];
            if (codes.includes(token)) {
                verified = true;
                const newCodes = codes.filter(c => c !== token);
                await User.update({ recoveryCodes: newCodes }, { where: { id: user.id } });
            }
        } else {
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token,
                window: 6
            });
        }

        if (verified) {
            const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ token: jwtToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
        } else {
            res.status(400).json({ message: isRecovery ? 'Invalid recovery code' : 'Invalid code' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.verifyEmailLogin = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.loginOtp) {
            return res.status(400).json({ message: 'Invalid Verification Code' });
        }

        const isMatch = await bcrypt.compare(otp, user.loginOtp);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Verification Code' });
        }
        if (new Date() > user.loginOtpExpires) {
            return res.status(400).json({ message: 'Verification Code Expired' });
        }

        // Clear OTP
        await User.update({ loginOtp: null, loginOtpExpires: null }, { where: { id: user.id } });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.verifyAnyLogin = async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let verified = false;
        let methodUsed = '';

        // 1. Check Authenticator (TOTP)
        if (user.twoFactorSecret) {
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token,
                window: 6
            });
            if (verified) methodUsed = 'TOTP';
        }

        // 2. Check Email OTP
        // 2. Check Email OTP (Hashed Check)
        if (!verified && user.loginOtp) {
            const isMatch = await bcrypt.compare(token.trim(), user.loginOtp);
            if (isMatch) {
                if (new Date() < user.loginOtpExpires) {
                    verified = true;
                    methodUsed = 'Email OTP';
                    // Clear OTP
                    await User.update({ loginOtp: null, loginOtpExpires: null }, { where: { id: user.id } });
                }
            }
        }

        // 3. Check Recovery Codes
        if (!verified && user.recoveryCodes) {
            const codes = user.recoveryCodes || [];
            if (codes.includes(token.trim())) {
                verified = true;
                methodUsed = 'Recovery Code';
                const newCodes = codes.filter(c => c !== token.trim());
                await User.update({ recoveryCodes: newCodes }, { where: { id: user.id } });
            }
        }

        console.log(`[VerifyAny] User: ${user.email}, Token: ${token}, Verified: ${verified}, Method: ${methodUsed}`);

        if (verified) {
            const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ token: jwtToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
        } else {
            res.status(400).json({ message: 'Invalid verification code' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.disableTwoFactor = async (req, res) => {
    try {
        await User.update({ isTwoFactorEnabled: false, twoFactorSecret: null, recoveryCodes: null }, { where: { id: req.user.id } });
        res.json({ message: 'Two-Factor Authentication Disabled' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
