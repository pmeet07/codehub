const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class PullRequest extends Model { }

PullRequest.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('open', 'closed', 'merged'),
        defaultValue: 'open'
    },
    number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    repositoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'repositories',
            key: 'id'
        }
    },
    sourceRepoId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'repositories',
            key: 'id'
        }
    },
    sourceBranch: {
        type: DataTypes.STRING,
        allowNull: false
    },
    targetBranch: {
        type: DataTypes.STRING,
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
    mergedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    mergedById: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'PullRequest',
    tableName: 'pull_requests',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['repositoryId', 'number']
        }
    ]
});

module.exports = PullRequest;
