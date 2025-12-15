/**
 * WatchHistory Model
 * Tracks user's video watching history (last 500 entries per user)
 */

import mongoose from 'mongoose';

const WatchHistorySchema = new mongoose.Schema(
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
        watchedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        watchDurationSec: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: false, // Using watchedAt instead
    }
);

// Compound index for user history queries
WatchHistorySchema.index({ userId: 1, watchedAt: -1 });

// Index for cleanup operations (TTL-like manual cleanup)
WatchHistorySchema.index({ watchedAt: -1 });

// Static method to add watch history and maintain limit
WatchHistorySchema.statics.addWatch = async function (userId, videoId, watchDurationSec = 0) {
    const MAX_HISTORY = 500;

    // Add new watch record
    await this.create({
        userId,
        videoId,
        watchDurationSec,
        watchedAt: new Date(),
    });

    // Count total records for this user
    const count = await this.countDocuments({ userId });

    // If over limit, delete oldest records
    if (count > MAX_HISTORY) {
        const toDelete = count - MAX_HISTORY;
        const oldestRecords = await this.find({ userId })
            .sort({ watchedAt: 1 })
            .limit(toDelete)
            .select('_id');

        const idsToDelete = oldestRecords.map(r => r._id);
        await this.deleteMany({ _id: { $in: idsToDelete } });
    }
};

// Static method to get user's watch history with Pagination
WatchHistorySchema.statics.getUserHistory = async function (userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
        this.find({ userId })
            .sort({ watchedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'videoId',
                select: 'title thumbnailUrl duration isPaid price status owner views category description',
                populate: [
                    { path: 'owner', select: 'username' },
                    { path: 'category', select: 'name' }
                ]
            }),
        this.countDocuments({ userId })
    ]);

    return { history, total };
};

// Force delete cached model in development
if (process.env.NODE_ENV === 'development' && mongoose.models.WatchHistory) {
    delete mongoose.models.WatchHistory;
}

const WatchHistory = mongoose.models.WatchHistory || mongoose.model('WatchHistory', WatchHistorySchema);

export default WatchHistory;
