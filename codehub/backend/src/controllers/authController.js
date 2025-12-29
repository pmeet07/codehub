const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; // Default for dev

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const savedUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        // Create Token
        const token = jwt.sign({ id: savedUser.id }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            token,
            user: {
                id: savedUser.id,
                username: savedUser.username,
                email: savedUser.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Simple validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields' });
        }

        // Check for user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        // Check Ban Status
        if (user.isBanned) {
            return res.status(403).json({ message: 'Your account has been permanently banned.' });
        }
        if (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) {
            return res.status(403).json({
                message: `Account suspended until ${new Date(user.banExpiresAt).toLocaleString()}`,
                banExpiresAt: user.banExpiresAt
            });
        }

        // If user registered with Google but trying to log in with password (and has no password)
        if (!user.password) {
            return res.status(400).json({ message: 'Please log in with Google' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create Token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        console.log('Received Google Token:', token ? 'User Token Present' : 'No Token');

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { name, email, picture, sub } = ticket.getPayload();
        console.log('Google Payload:', { name, email });

        // Check if user exists
        let user = await User.findOne({ where: { email } });

        if (user) {
            // Check ban
            if (user.isBanned) return res.status(403).json({ message: 'Banned' });

            // If existing user doesn't have googleId, link it
            if (!user.googleId) {
                user.googleId = sub;
                // If avatar is default, update it
                if (user.avatarUrl && user.avatarUrl.includes('identicons')) {
                    user.avatarUrl = picture;
                }
                await user.save();
            }
        } else {
            // Create new user
            // Generate unique username from name or email
            let username = name.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000);

            // Ensure username is unique
            let isUnique = false;
            while (!isUnique) {
                const existing = await User.findOne({ where: { username } });
                if (!existing) isUnique = true;
                else username += Math.floor(Math.random() * 100);
            }

            user = await User.create({
                username,
                email,
                googleId: sub,
                avatarUrl: picture,
                role: 'user' // Default role
            });
        }

        const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ message: 'Google Authentication Failed' });
    }
};

// Get current user (protected route helper)
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
