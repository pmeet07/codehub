const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g., "DELETE_REPO", "BAN_USER"
    targetId: { type: String }, // ID of the User or Repo affected
    details: { type: Object }, // JSON details of the change
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminLog', AdminLogSchema);
