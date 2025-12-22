/**
 * Transaction Model
 * Records all money movements: deposits, purchases, fees, withdrawals
 * 
 * CRITICAL: This model is central to the audit trail and money handling.
 * All balance changes MUST have a corresponding Transaction record.
 */

import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            // Stored in cents; can be negative for debits
        },
        senderName: {
            type: String,
        },
        currency: {
            type: String,
            default: 'ETB',
            uppercase: true,
        },
        type: {
            type: String,
            enum: ['deposit', 'withdraw', 'fee', 'purchase', 'refund', 'adjustment', 'referral_bonus', 'subscription'],
            required: [true, 'Transaction type is required'],
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'failed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        // For deposit screenshots
        cloudinaryUrl: {
            type: String,
        },
        cloudinaryId: {
            type: String,
        },
        // Additional transaction metadata
        metadata: {
            senderName: String,
            transactionCode: String,
            phone: String,
            rawText: String,
            // For purchases
            videoId: mongoose.Schema.Types.ObjectId,
            photoId: mongoose.Schema.Types.ObjectId,
            ownerId: mongoose.Schema.Types.ObjectId,
            videoTitle: String,
            photoTitle: String,
            // For platform fees
            feePercent: Number,
            // Polar.sh payment metadata
            source: String, // 'polar' for card payments
            orderId: String, // Polar order ID
            polarCustomerEmail: String,
            originalCurrency: String, // 'USD' for Polar
            originalAmount: Number, // Original USD amount in cents
            conversionRate: Number, // Exchange rate used
            // Any other contextual data
            notes: String,
        },
        // Admin processing
        adminNote: {
            type: String,
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        processedAt: {
            type: Date,
        },
        // For idempotency and duplicate detection
        idempotencyKey: {
            type: String,
            sparse: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
TransactionSchema.index({ userId: 1, type: 1, status: 1 });
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ processedBy: 1, processedAt: -1 });

// Virtual for display amount (cents to ETB)
TransactionSchema.virtual('displayAmount').get(function () {
    return this.amount / 100;
});

// Method to check if transaction can be modified
TransactionSchema.methods.canModify = function () {
    return this.status === 'pending';
};

// Static method to get user transaction history
TransactionSchema.statics.getUserHistory = function (userId, page = 1, limit = 20) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('processedBy', 'username email');
};

// Static method to get pending deposits
TransactionSchema.statics.getPendingDeposits = function (page = 1, limit = 20) {
    return this.find({ type: 'deposit', status: 'pending' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'username email balance');
};

TransactionSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v;
        return ret;
    },
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

export default Transaction;
