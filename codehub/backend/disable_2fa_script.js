const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
    dialect: 'postgres',
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    isTwoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
    recoveryCodes: { type: DataTypes.JSON, allowNull: true }
}, {
    timestamps: true
});

async function disable2FA() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const email = 'mpaj1505@gmail.com'; // Target user
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User not found!');
            return;
        }

        console.log(`User found: ${user.email}`);
        console.log(`Current 2FA Status: ${user.isTwoFactorEnabled}`);

        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = null;
        user.recoveryCodes = null;
        await user.save();

        console.log('SUCCESS: 2FA has been forcefully DISABLED for this user.');
        console.log('You can now login normally.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

disable2FA();
