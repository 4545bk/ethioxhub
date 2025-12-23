import mongoose from 'mongoose';

const LinaUnlockSchema = new mongoose.Schema({
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LinaProfile',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amountPaid: { type: Number, default: 1000 }, // ETB
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved' // Auto-approved since payment already deducted
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index to prevent duplicate unlocks
LinaUnlockSchema.index({ profileId: 1, userId: 1 }, { unique: true });

export default mongoose.models.LinaUnlock || mongoose.model('LinaUnlock', LinaUnlockSchema);
