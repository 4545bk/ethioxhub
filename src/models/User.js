/**
 * User Model
 * Stores user accounts with balance management for VIP content purchases
 * 
 * CRITICAL: balance and reservedBalance are stored in CENTS to avoid floating-point errors
 * Example: 100 ETB = 10000 cents
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username must be less than 30 characters'],
            match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
            index: true,
        },
        passwordHash: {
            type: String,
            required: false, // Optional for Google Sign-In users
            select: false,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        authProvider: {
            type: String,
            enum: ['email', 'google'],
            default: 'email',
        },
        profilePicture: {
            type: String,
            default: '',
        },
        balance: {
            type: Number,
            default: 0,
            min: [0, 'Balance cannot be negative'],
            // Stored in cents (e.g., 10000 cents = 100 ETB)
        },
        reservedBalance: {
            type: Number,
            default: 0,
            min: [0, 'Reserved balance cannot be negative'],
            // Locked funds for in-progress transactions
        },
        roles: {
            type: [String],
            enum: ['user', 'admin', 'moderator'],
            default: ['user'],
        },
        verifiedAge: {
            type: Boolean,
            default: false,
            // For adult content gating if needed
        },
        banned: {
            type: Boolean,
            default: false,
        },
        banReason: {
            type: String,
        },
        lastLogin: {
            type: Date,
        },
        unlockedVideos: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video'
        }],
        unlockedPhotos: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Photo'
        }],
        subscriptionExpiresAt: {
            type: Date
        },
        // Referral System
        referralCode: {
            type: String,
            sparse: true,
            unique: true,
        },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        referralCount: {
            type: Number,
            default: 0,
        },
        totalReferralEarnings: {
            type: Number,
            default: 0, // in cents
        },
        // Notifications
        notifications: [{
            type: {
                type: String,
                enum: ['info', 'success', 'warning', 'error', 'referral'],
                default: 'info'
            },
            message: String,
            link: String,
            read: {
                type: Boolean,
                default: false
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        metadata: {
            ipAddress: String,
            userAgent: String,
        },
    },
    {
        timestamps: true,
    }
);

// Index for role-based queries
UserSchema.index({ roles: 1 });
UserSchema.index({ banned: 1 });

// Virtual for available balance (balance - reserved)
UserSchema.virtual('availableBalance').get(function () {
    return this.balance - this.reservedBalance;
});

// Method to check if user has a specific role
UserSchema.methods.hasRole = function (role) {
    return this.roles.includes(role);
};

// Virtual for subscription status
UserSchema.virtual('isSubscriber').get(function () {
    return this.subscriptionExpiresAt && this.subscriptionExpiresAt > new Date();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    // Need to select passwordHash explicitly since it's excluded by default
    const user = await mongoose.model('User').findById(this._id).select('+passwordHash');
    return bcrypt.compare(candidatePassword, user.passwordHash);
};

// Static method to hash password
UserSchema.statics.hashPassword = async function (password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    return bcrypt.hash(password, rounds);
};

// Pre-save hook to update lastLogin
UserSchema.pre('save', function (next) {
    if (this.isNew) {
        this.lastLogin = new Date();
    }
    next();
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
    },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
