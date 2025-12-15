/**
 * ModerationLog Model
 * Records all moderation actions for audit trail and compliance
 */

import mongoose from 'mongoose';

const ModerationLogSchema = new mongoose.Schema(
    {
        videoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video',
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: [
                'auto-flag',
                'auto-approve',
                'manual-approve',
                'manual-reject',
                'user-report',
                'admin-delete',
            ],
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            // Null for automated actions
        },
        metadata: {
            flags: [String],
            confidence: Number, // 0-1 for auto-moderation confidence
            reportCount: Number,
            previousStatus: String,
            newStatus: String,
        },
    },
    {
        timestamps: true,
    }
);

ModerationLogSchema.index({ videoId: 1, createdAt: -1 });
ModerationLogSchema.index({ adminId: 1, createdAt: -1 });
ModerationLogSchema.index({ action: 1, createdAt: -1 });

const ModerationLog = mongoose.models.ModerationLog || mongoose.model('ModerationLog', ModerationLogSchema);

export default ModerationLog;
