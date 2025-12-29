const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Report extends Model { }

Report.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    targetType: {
        type: DataTypes.ENUM('repo', 'user', 'comment'),
        allowNull: false
    },
    targetId: {
        type: DataTypes.UUID, // Assuming all targets use UUIDs now
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
        defaultValue: 'pending'
    }
}, {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true
});

module.exports = Report;
