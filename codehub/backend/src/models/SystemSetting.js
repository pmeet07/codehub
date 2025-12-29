const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class SystemSetting extends Model {
    static async getConfig() {
        let config = await this.findOne();
        if (!config) {
            config = await this.create({});
        }
        return config;
    }
}

SystemSetting.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    allowRegistration: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    maintenanceMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    maxRepoSizeMB: {
        type: DataTypes.INTEGER,
        defaultValue: 500
    },
    defaultBranchName: {
        type: DataTypes.STRING,
        defaultValue: 'main'
    }
}, {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true
});

module.exports = SystemSetting;
