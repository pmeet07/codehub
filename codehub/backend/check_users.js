const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
    dialect: 'postgres',
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    username: { type: DataTypes.STRING },
    isTwoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
    recoveryCodes: { type: DataTypes.JSON, allowNull: true }
}, {
    timestamps: true
});

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const users = await User.findAll();
        console.log('--- USER STATUS REPORT ---');
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | Username: ${u.username}`);
            console.log(`    2FA Enabled: ${u.isTwoFactorEnabled}`);
            console.log(`    Secret Present: ${!!u.twoFactorSecret}`);
            console.log('-----------------------------------');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
