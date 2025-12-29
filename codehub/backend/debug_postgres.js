const { sequelize, User } = require('./src/models');

async function testConnection() {
    try {
        console.log('Testing connection...');
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        console.log('Syncing models...');
        await sequelize.sync({ alter: true }); // This will create tables if they don't exist
        console.log('✅ Models synced.');

        console.log('Attempting to create a test user...');
        const uniqueName = 'testuser_' + Math.floor(Math.random() * 10000);
        const newUser = await User.create({
            username: uniqueName,
            email: `${uniqueName}@example.com`,
            password: 'password123'
        });
        console.log('✅ Test User created:', newUser.toJSON());

    } catch (error) {
        console.error('❌ Unable to connect or run operations:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection();
