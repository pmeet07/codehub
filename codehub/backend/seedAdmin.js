const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codehub';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');

        const email = 'admin@codehub.com';
        const password = 'admin123';
        const username = 'admin';

        let user = await User.findOne({ email });

        if (user) {
            console.log('Admin user already exists. Updating role...');
            user.role = 'admin';
            await user.save();
            console.log('User role updated to admin');
        } else {
            console.log('Creating new admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({
                username,
                email,
                password: hashedPassword,
                role: 'admin'
            });

            await user.save();
            console.log('Admin user created successfully');
        }

        console.log(`
=========================================
ADMIN CREDENTIALS:
Email:    ${email}
Password: ${password}
=========================================
        `);

        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
