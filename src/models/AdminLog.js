/**
 * AdminLog Model
 * Records all admin actions for security audit trail
 * CRITICAL: All admin actions that change money or user state must be logged here
 */

import mongoose from 'mongoose';

const AdminLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: [
                'approve-deposit',
                'reject-deposit',
                'adjust-balance',
                'ban-user',
                'unban-user',
                'approve-video',
                'reject-video',
                'delete-video',
                'change-role',
                'manual-transaction',
            ],
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            enum: ['user', 'video', 'transaction'],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        metadata: {
            amount: Number,
            reason: String,
            previousValue: mongoose.Schema.Types.Mixed,
            newValue: mongoose.Schema.Types.Mixed,
            ipAddress: String,
            userAgent: String,
        },
    },
    {
        timestamps: true,
    }
);

AdminLogSchema.index({ adminId: 1, createdAt: -1 });
AdminLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AdminLogSchema.index({ action: 1, createdAt: -1 });

// Static method to log admin action
AdminLogSchema.statics.logAction = function (adminId, action, targetType, targetId, metadata = {}) {
    return this.create({
        adminId,
        action,
        targetType,
        targetId,
        metadata,
    });
};

const AdminLog = mongoose.models.AdminLog || mongoose.model('AdminLog', AdminLogSchema);

export default AdminLog;
