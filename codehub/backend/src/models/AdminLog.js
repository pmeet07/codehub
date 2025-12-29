const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class AdminLog extends Model { }

AdminLog.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    adminId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    targetId: {
        type: DataTypes.STRING, // Can be User ID or Repo ID
        allowNull: true
    },
    details: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'AdminLog',
    tableName: 'admin_logs',
    timestamps: false // using timestamp field
});

module.exports = AdminLog;
