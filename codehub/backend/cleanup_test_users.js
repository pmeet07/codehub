const { User, sequelize } = require('./src/models');
const { Op } = require('sequelize');

async function cleanUp() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB...');

        // Delete users starting with 'testuser_'
        const deletedCount = await User.destroy({
            where: {
                username: {
                    [Op.like]: 'testuser_%'
                }
            }
        });

        console.log(`✅ Deleted ${deletedCount} test user(s).`);

    } catch (error) {
        console.error('Error cleaning up:', error);
    } finally {
        await sequelize.close();
    }
}

cleanUp();
