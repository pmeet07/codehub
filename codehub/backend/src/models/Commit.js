const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Commit extends Model { }

Commit.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    repoId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'repositories',
            key: 'id'
        }
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    parentHash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    treeHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'Commit',
    tableName: 'commits',
    timestamps: false, // We use 'timestamp' field
    indexes: [
        {
            unique: true,
            fields: ['repoId', 'hash']
        }
    ]
});

module.exports = Commit;
