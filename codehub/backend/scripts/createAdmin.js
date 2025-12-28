require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codehub';

const createAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for Admin Setup...");

        const email = "admin@codehub.com";
        const password = "admin123"; // Simple password for initial access
        const username = "SystemAdmin";

        // Check if exists
        let user = await User.findOne({ email });

        if (user) {
            console.log("⚠️  Admin user found. Updating privileges and password...");
        } else {
            console.log("✨ Creating NEW Admin user...");
            user = new User({ email, username });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Force Metadata
        user.role = 'admin';
        user.username = username; // Ensure username matches
        user.email = email;
        user.isBanned = false;

        await user.save();

        console.log(`
        ===========================================
        ✅ ADMIN ACCESS RESTORED
        ===========================================
        URL:      http://localhost:5173/admin/login (or just Login)
        Email:    ${email}
        Password: ${password}
        Role:     admin
        ===========================================
        `);

    } catch (err) {
        console.error("❌ Error creating admin:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

createAdmin();
