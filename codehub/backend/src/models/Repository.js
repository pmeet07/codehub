const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Repository extends Model { }

Repository.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^[a-zA-Z0-9-_]+$/
        }
    },
    progLanguage: {
        type: DataTypes.STRING,
        defaultValue: 'JavaScript'
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    defaultBranch: {
        type: DataTypes.STRING,
        defaultValue: 'main'
    },
    headCommitId: {
        type: DataTypes.UUID,
        allowNull: true
        // References 'commits' - define association later to avoid circular dependency
    },
    forkedFromId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'repositories',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Repository',
    tableName: 'repositories',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['ownerId', 'name']
        }
    ]
});

module.exports = Repository;
