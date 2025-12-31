const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User extends Model { }

User.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 255]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatarUrl: {
        type: DataTypes.STRING,
        defaultValue: 'https://github.com/identicons/default.png'
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user'
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    banExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    bio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },
    twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true
    },
    recoveryCodes: {
        type: DataTypes.JSON,
        allowNull: true
    },
    loginOtp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    loginOtpExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isTwoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
});

module.exports = User;
