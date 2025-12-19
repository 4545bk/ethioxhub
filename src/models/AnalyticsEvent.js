import mongoose from 'mongoose';

const AnalyticsEventSchema = new mongoose.Schema(
    {
        // Event type
        type: {
            type: String,
            enum: ['page_view', 'video_view', 'photo_view', 'purchase', 'signup', 'login'],
            required: true,
            index: true,
        },
        // User info (if logged in)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        // Session tracking
        sessionId: {
            type: String,
            index: true,
        },
        // Page/Resource info
        page: {
            type: String,
            index: true,
        },
        referrer: String,
        // Device & Location
        userAgent: String,
        ip: String,
        country: String,
        city: String,
        // Metadata
        metadata: {
            type: Map,
            of: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
AnalyticsEventSchema.index({ sessionId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
