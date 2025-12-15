/**
 * WatchProgress Model
 * Tracks user's video watching progress for "Continue Watching" feature
 */

import mongoose from 'mongoose';

const WatchProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        videoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video',
            required: true,
            index: true,
        },
        progressPercent: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        lastPositionSec: {
            type: Number,
            min: 0,
            default: 0,
        },
        lastSeenAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        completed: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Unique compound index - one progress record per user/video
WatchProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Index for fetching recent progress
WatchProgressSchema.index({ userId: 1, lastSeenAt: -1 });
WatchProgressSchema.index({ userId: 1, completed: 1, lastSeenAt: -1 });

// Force delete cached model in development
if (process.env.NODE_ENV === 'development' && mongoose.models.WatchProgress) {
    delete mongoose.models.WatchProgress;
}

const WatchProgress = mongoose.models.WatchProgress || mongoose.model('WatchProgress', WatchProgressSchema);

export default WatchProgress;
