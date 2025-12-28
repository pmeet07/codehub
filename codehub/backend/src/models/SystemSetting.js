const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
    allowRegistration: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maxRepoSizeMB: { type: Number, default: 500 },
    defaultBranchName: { type: String, default: 'main' },
    updatedAt: { type: Date, default: Date.now }
});

// Singleton pattern helper
SystemSettingSchema.statics.getConfig = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
