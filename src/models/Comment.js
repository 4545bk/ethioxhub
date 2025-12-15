/**
 * Comment Model
 * User comments on videos with moderation support
 */

import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
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
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
            index: true,
        },
        text: {
            type: String,
            required: [true, 'Comment text is required'],
            maxlength: [1000, 'Comment must be less than 1000 characters'],
            trim: true,
        },
        deleted: {
            type: Boolean,
            default: false,
            index: true,
        },
        moderated: {
            type: Boolean,
            default: false,
            index: true,
        },
        moderationReason: {
            type: String,
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        moderatedAt: {
            type: Date,
        },
        likesCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        repliesCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
CommentSchema.index({ videoId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ videoId: 1, parentId: 1, createdAt: -1 });
CommentSchema.index({ deleted: 1, moderated: 1 });

// Virtual for nested replies
CommentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentId',
});

// Set toJSON options
CommentSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    },
});

// Force delete cached model in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Comment) {
    delete mongoose.models.Comment;
}

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

export default Comment;
