import mongoose from 'mongoose';

const AnalyticsEventSchema = new mongoose.Schema({
    // Event type: page_view, video_view, purchase, etc.
    type: {
        type: String,
        required: true,
        enum: ['page_view', 'video_view', 'purchase', 'session_end'],
        index: true
    },

    // Session identifier (browser session)
    sessionId: {
        type: String,
        required: true,
        index: true
    },

    // User ID if logged in
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    // Page or resource being tracked
    page: {
        type: String,
        required: true
    },

    // IP address for geo tracking
    ipAddress: {
        type: String
    },

    // User agent
    userAgent: {
        type: String
    },

    // Referrer URL
    referrer: {
        type: String
    },

    // Additional metadata (flexible for future needs)
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for efficient queries
AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
AnalyticsEventSchema.index({ sessionId: 1, createdAt: -1 });

// Prevent model recompilation in Next.js hot reload
const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;
