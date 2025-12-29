const { User, sequelize } = require('./src/models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected');

        const email = 'admin@codehub.com';
        const password = 'admin123';
        const username = 'admin';

        let user = await User.findOne({ where: { email } });

        if (user) {
            console.log('Admin user already exists. Updating role...');
            user.role = 'admin';
            await user.save();
            console.log('User role updated to admin');
        } else {
            console.log('Creating new admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await User.create({
                username,
                email,
                password: hashedPassword,
                role: 'admin'
            });

            console.log('Admin user created successfully');
        }

        console.log(`
=========================================
ADMIN CREDENTIALS:
Email:    ${email}
Password: ${password}
=========================================
        `);

        await sequelize.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
