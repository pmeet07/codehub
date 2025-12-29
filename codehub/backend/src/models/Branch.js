const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Branch extends Model { }

Branch.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    commitHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    repoId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'repositories',
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Branch',
    tableName: 'branches',
    timestamps: true, // track when branch updated
    indexes: [
        {
            unique: true,
            fields: ['repoId', 'name']
        }
    ]
});

module.exports = Branch;
