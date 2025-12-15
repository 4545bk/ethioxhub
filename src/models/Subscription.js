/**
 * Subscription Model
 * For future subscription-based VIP access (optional feature)
 */

import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['monthly', 'quarterly', 'annual'],
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'cancelled', 'expired', 'suspended'],
            default: 'active',
            index: true,
        },
        price: {
            type: Number,
            required: true,
            // Stored in cents
        },
        currency: {
            type: String,
            default: 'ETB',
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: true,
        },
        autoRenew: {
            type: Boolean,
            default: false,
        },
        cancelledAt: {
            type: Date,
        },
        providerMeta: {
            // For future payment provider integration (Stripe, etc.)
            providerId: String,
            subscriptionId: String,
            customerId: String,
            lastPaymentDate: Date,
            nextBillingDate: Date,
        },
    },
    {
        timestamps: true,
    }
);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 });

// Method to check if subscription is active
SubscriptionSchema.methods.isActive = function () {
    return this.status === 'active' && this.endDate > new Date();
};

// Static method to get active subscription for user
SubscriptionSchema.statics.getActiveSubscription = function (userId) {
    return this.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() },
    });
};

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;
