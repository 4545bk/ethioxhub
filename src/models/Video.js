/**
 * Video Model
 * Stores video metadata, ownership, visibility settings, and moderation status
 */

import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title must be less than 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description must be less than 2000 characters'],
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            index: true,
        },
        tags: {
            type: [String],
            validate: {
                validator: function (tags) {
                    return tags.length <= 10;
                },
                message: 'Maximum 10 tags allowed',
            },
            index: true,
        },
        isPaid: {
            type: Boolean,
            default: false,
            index: true
        },
        price: {
            type: Number,
            min: [0, 'Price cannot be negative'],
            default: 0
        },
        // Storage Provider
        provider: {
            type: String,
            enum: ['cloudinary', 's3'],
            default: 'cloudinary',
            index: true
        },
        // Cloudinary data
        cloudinaryPublicId: {
            type: String,
            unique: true,
            sparse: true,
        },
        cloudinaryUrl: {
            type: String,
        },
        cloudinaryHlsUrl: { type: String },
        cloudinaryRawUrl: { type: String },
        // AWS S3 data
        s3Key: {
            type: String,
        },
        s3Bucket: {
            type: String,
        },
        // Preview URLs for hover
        previewUrl: {
            type: String,
        },
        previewCloudinaryId: {
            type: String,
        },
        previewS3Key: {
            type: String,
        },
        thumbnailUrl: {
            type: String,
        },
        // Video metadata
        duration: {
            type: Number, // in seconds
        },
        width: {
            type: Number,
        },
        height: {
            type: Number,
        },
        fileSize: {
            type: Number, // in bytes
        },
        format: {
            type: String,
        },
        // Processing and moderation status
        status: {
            type: String,
            enum: ['uploaded', 'processing', 'pending_moderation', 'approved', 'rejected', 'deleted'],
            default: 'uploaded',
            index: true,
        },
        moderationFlags: {
            type: [String],
            // e.g., ['nudity', 'violence', 'copyright']
        },
        rejectionReason: {
            type: String,
        },
        // Analytics
        views: {
            type: Number,
            default: 0,
            index: true,
        },
        purchases: {
            type: Number,
            default: 0,
        },
        earnings: {
            type: Number,
            default: 0,
            // Total earnings in cents (after platform fee)
        },
        // Engagement metrics
        likesCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        dislikesCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Likes/dislikes by user (embedded for quick lookup)
        likedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        dislikedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

// Pre-save validation hook to enforce provider-specific requirements
// Pre-save validation hook to enforce provider-specific requirements
VideoSchema.pre('save', function (next) {
    if (this.provider === 'cloudinary') {
        // Only enforce check if it's a new video or provider/id is being modified
        // This allows editing legacy videos that might have missing data
        if (!this.cloudinaryPublicId && (this.isNew || this.isModified('provider') || this.isModified('cloudinaryPublicId'))) {
            return next(new Error('cloudinaryPublicId is required for Cloudinary uploads'));
        }

        // If it's a new video with cloudinary provider, url is required
        if (!this.cloudinaryUrl && (this.isNew || this.isModified('provider') || this.isModified('cloudinaryUrl'))) {
            return next(new Error('cloudinaryUrl is required for Cloudinary uploads'));
        }
    } else if (this.provider === 's3') {
        if (!this.s3Key && (this.isNew || this.isModified('provider') || this.isModified('s3Key'))) {
            return next(new Error('s3Key is required for S3 uploads'));
        }
    }
    next();
});

// Compound indexes for queries
VideoSchema.index({ status: 1, createdAt: -1 });
VideoSchema.index({ owner: 1, status: 1, createdAt: -1 });
VideoSchema.index({ tags: 1, status: 1 });
VideoSchema.index({ createdAt: -1, views: -1 });

// Virtual for display price (cents to ETB)
VideoSchema.virtual('displayPrice').get(function () {
    return this.price ? this.price / 100 : 0;
});

// Method to check if user has access
VideoSchema.methods.canAccess = async function (userId) {
    // 1. If Free, everyone can access
    if (!this.isPaid) return true;

    // 2. Owner always has access
    if (userId && this.owner.toString() === userId.toString()) return true;

    // 3. If User is present, check purchase or sub
    if (userId) {
        const User = mongoose.model('User');
        const user = await User.findById(userId);

        // A. Check Subscription
        if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()) {
            return true;
        }

        // B. Check Unlocked List
        if (user.unlockedVideos && user.unlockedVideos.includes(this._id)) {
            return true;
        }
    }

    return false;
};

// Method to increment views
VideoSchema.methods.incrementViews = function () {
    return this.constructor.findByIdAndUpdate(
        this._id,
        { $inc: { views: 1 } },
        { new: false }
    );
};

// Static method to get public videos
VideoSchema.statics.getPublicVideos = function (filters = {}, page = 1, limit = 20) {
    const query = {
        status: 'approved',
        ...filters,
    };

    return this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('owner', 'username')
        .select('-cloudinaryRawUrl');
};

// Static method to get pending moderation
VideoSchema.statics.getPendingModeration = function (page = 1, limit = 20) {
    return this.find({ status: 'pending_moderation' })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('owner', 'username email');
};

VideoSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    },
});

// Force delete cached model in development to ensure schema changes are picked up
if (process.env.NODE_ENV === 'development' && mongoose.models.Video) {
    delete mongoose.models.Video;
}

const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);

export default Video;
