const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // 1. Verify Token
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id: '...', ... }

        // 2. Database Check (CRITICAL)
        const user = await User.findById(req.user.id);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
