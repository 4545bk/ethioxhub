import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    url: {
        type: String,
        required: true
    },
    thumbnailUrl: String, // For optimized loading if processed
    isPaid: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number, // In cents
        default: 0
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'hidden'],
        default: 'active'
    }
}, { timestamps: true });

// Check access method
PhotoSchema.methods.canAccess = function (user) {
    if (!this.isPaid) return true;
    if (!user) return false;
    // Admin always access
    if (user.roles?.includes('admin') || this.owner.toString() === user._id.toString()) return true;

    // Check if purchased
    if (user.unlockedPhotos && user.unlockedPhotos.some(id => id.toString() === this._id.toString())) {
        return true;
    }

    // Check subscription (optional, depending on business rules, but good fallback)
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()) {
        return true;
    }

    return false;
};

export default mongoose.models.Photo || mongoose.model('Photo', PhotoSchema);
