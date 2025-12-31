const { Sequelize, DataTypes } = require('sequelize');
const speakeasy = require('speakeasy');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`, {
    dialect: 'postgres',
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    twoFactorSecret: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true });

async function debug2FA() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const email = 'mpaj1505@gmail.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User not found!');
            return;
        }

        console.log('--- 2FA DIAGNOSTICS ---');
        console.log(`User: ${user.email}`);
        console.log(`Secret (Base32): ${user.twoFactorSecret}`);

        if (!user.twoFactorSecret) {
            console.log('ERROR: No secret stored!');
            return;
        }

        const token = speakeasy.totp({
            secret: user.twoFactorSecret,
            encoding: 'base32'
        });

        console.log(`Server Time: ${new Date().toISOString()}`);
        console.log(`EXPECTED TOKEN NOW: ${token}`);

        // Check window
        const tokenMinus1 = speakeasy.totp({ secret: user.twoFactorSecret, encoding: 'base32', time: (Date.now() / 1000) - 30 });
        const tokenPlus1 = speakeasy.totp({ secret: user.twoFactorSecret, encoding: 'base32', time: (Date.now() / 1000) + 30 });

        console.log(`Previous Window: ${tokenMinus1}`);
        console.log(`Next Window:     ${tokenPlus1}`);
        console.log('-----------------------');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

debug2FA();
