/**
 * Anti-Fraud & Security Utilities
 * Comprehensive fraud detection and prevention system
 */

import connectDB from './db';

// ==================== FRAUD DETECTION ====================

/**
 * Check for suspicious referral patterns
 * Prevents referral gaming/abuse
 */
export async function detectReferralFraud(referrerId, newUserId, ipAddress) {
    try {
        await connectDB();
        const User = (await import('@/models/User')).default;

        const referrer = await User.findById(referrerId);
        if (!referrer) return { isFraudulent: false };

        const fraudIndicators = [];

        // 1. Check for excessive referrals in short time (>5 in 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentReferrals = referrer.referralCount || 0;

        // Count recent referrals from database
        const recentUsersByReferrer = await User.countDocuments({
            referredBy: referrerId,
            createdAt: { $gte: oneHourAgo }
        });

        if (recentUsersByReferrer > 5) {
            fraudIndicators.push('excessive_referrals_per_hour');
        }

        // 2. Check for suspicious total referral count (>50 total is suspicious)
        if (recentReferrals > 50) {
            fraudIndicators.push('excessive_total_referrals');
        }

        // 3. Check for same IP address (store in metadata if needed)
        // Note: This requires IP tracking - implement if needed

        return {
            isFraudulent: fraudIndicators.length > 0,
            indicators: fraudIndicators,
            severity: fraudIndicators.length >= 2 ? 'high' : 'medium'
        };

    } catch (error) {
        console.error('[Fraud Detection] Error:', error);
        return { isFraudulent: false }; // Fail open to not block legitimate users
    }
}

/**
 * Check for deposit fraud patterns
 * Prevents fake deposit submissions
 */
export async function detectDepositFraud(userId, amount, metadata = {}) {
    try {
        await connectDB();
        const User = (await import('@/models/User')).default;
        const Transaction = (await import('@/models/Transaction')).default;

        const fraudIndicators = [];

        // 1. Check for excessive deposit requests (>3 per hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentDeposits = await Transaction.countDocuments({
            user: userId,
            type: 'deposit',
            createdAt: { $gte: oneHourAgo }
        });

        if (recentDeposits > 3) {
            fraudIndicators.push('excessive_deposits_per_hour');
        }

        // 2. Check for unrealistic amounts (>100,000 ETB)
        if (amount > 10000000) { // 100,000 ETB in cents
            fraudIndicators.push('unrealistic_amount');
        }

        // 3. Check for very small amounts repeatedly (<1 ETB)
        if (amount < 100) {
            const smallDeposits = await Transaction.countDocuments({
                user: userId,
                type: 'deposit',
                amount: { $lt: 100 },
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });
            if (smallDeposits > 5) {
                fraudIndicators.push('repeated_small_deposits');
            }
        }

        // 4. Check for pending deposits (>5 unresolved)
        const pendingCount = await Transaction.countDocuments({
            user: userId,
            type: 'deposit',
            status: 'pending'
        });

        if (pendingCount > 5) {
            fraudIndicators.push('excessive_pending_deposits');
        }

        return {
            isFraudulent: fraudIndicators.length > 0,
            indicators: fraudIndicators,
            severity: fraudIndicators.length >= 2 ? 'high' : 'medium'
        };

    } catch (error) {
        console.error('[Deposit Fraud Detection] Error:', error);
        return { isFraudulent: false };
    }
}

/**
 * Check for purchase fraud patterns
 * Prevents exploitation of purchase system
 */
export async function detectPurchaseFraud(userId, videoId, amount) {
    try {
        await connectDB();
        const User = (await import('@/models/User')).default;
        const Video = (await import('@/models/Video')).default;

        const fraudIndicators = [];
        const user = await User.findById(userId);
        const video = await Video.findById(videoId);

        if (!user || !video) return { isFraudulent: false };

        // 1. Check if user already owns the video
        if (user.unlockedVideos?.includes(videoId)) {
            fraudIndicators.push('already_purchased');
        }

        // 2. Check if amount matches video price
        if (video.price !== amount) {
            fraudIndicators.push('price_mismatch');
        }

        // 3. Check for balance manipulation attempts
        if (user.balance < 0) {
            fraudIndicators.push('negative_balance');
        }

        // 4. Check for excessive purchases in short time (>10 per minute)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentPurchases = user.unlockedVideos?.filter(v => {
            // This is simplified - in production, track purchase timestamps
            return true;
        }).length || 0;

        if (recentPurchases > 10) {
            fraudIndicators.push('excessive_purchases');
        }

        return {
            isFraudulent: fraudIndicators.length > 0,
            indicators: fraudIndicators,
            severity: fraudIndicators.length >= 2 ? 'high' : 'medium'
        };

    } catch (error) {
        console.error('[Purchase Fraud Detection] Error:', error);
        return { isFraudulent: false };
    }
}

// ==================== INPUT SANITIZATION ====================

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input, type = 'text') {
    if (!input) return input;

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    switch (type) {
        case 'email':
            // Email: lowercase, trim, basic format check
            sanitized = sanitized.toLowerCase().trim();
            break;

        case 'username':
            // Username: alphanumeric + underscores only
            sanitized = sanitized.replace(/[^a-zA-Z0-9_]/g, '');
            break;

        case 'text':
            // Text: remove dangerous HTML/script tags
            sanitized = sanitized
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // onclick, onerror, etc.
            break;

        case 'number':
            // Number: digits only
            sanitized = sanitized.replace(/[^0-9.-]/g, '');
            break;

        default:
            break;
    }

    return sanitized.trim();
}

/**
 * Validate and sanitize file uploads
 */
export function validateFileUpload(file, allowedTypes = [], maxSize = 10485760) { // 10MB default
    const fraudIndicators = [];

    // Check file size
    if (file.size > maxSize) {
        fraudIndicators.push('file_too_large');
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        fraudIndicators.push('invalid_file_type');
    }

    // Check for null bytes in filename (directory traversal attempt)
    if (file.name.includes('\0') || file.name.includes('..')) {
        fraudIndicators.push('malicious_filename');
    }

    // Check for executable extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.py', '.jar'];
    const hasDangerousExt = dangerousExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
    );

    if (hasDangerousExt) {
        fraudIndicators.push('dangerous_file_extension');
    }

    return {
        isValid: fraudIndicators.length === 0,
        indicators: fraudIndicators
    };
}

// ==================== LOGGING & MONITORING ====================

/**
 * Log suspicious activity for monitoring
 */
export async function logSuspiciousActivity(activityType, details) {
    try {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.warn('[FRAUD ALERT]', activityType, details);
        }

        // In production, you might want to:
        // 1. Log to a dedicated security log file
        // 2. Send alerts to admin
        // 3. Store in a security events database
        // 4. Integrate with monitoring service (Sentry, LogRocket, etc.)

        // For now, just console log with timestamp
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: activityType,
            details,
            severity: details.severity || 'medium'
        };

        console.error('[SECURITY LOG]', JSON.stringify(logEntry));

        // TODO: In production, implement proper logging
        // await SecurityLog.create(logEntry);

    } catch (error) {
        console.error('[Logging Error]', error);
    }
}

// ==================== RATE LIMITING HELPERS ====================

/**
 * Enhanced rate limiting for critical operations
 */
export function getStrictRateLimit(operation) {
    const limits = {
        // Auth operations
        'auth/register': { max: 3, window: 3600000 }, // 3 per hour
        'auth/login': { max: 5, window: 900000 }, // 5 per 15 min

        // Financial operations
        'deposit/create': { max: 5, window: 3600000 }, // 5 per hour
        'purchase': { max: 20, window: 60000 }, // 20 per minute
        'withdraw': { max: 3, window: 3600000 }, // 3 per hour

        // Content operations
        'video/upload': { max: 10, window: 3600000 }, // 10 per hour
        'comment/create': { max: 30, window: 600000 }, // 30 per 10 min

        // General API
        'api/general': { max: 100, window: 60000 }, // 100 per minute
    };

    return limits[operation] || limits['api/general'];
}

// ==================== VALIDATION HELPERS ====================

/**
 * Validate Ethereum-style addresses (for future crypto integration)
 */
export function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate phone number (Ethiopian format)
 */
export function isValidEthiopianPhone(phone) {
    // Ethiopian phone: +251XXXXXXXXX or 0XXXXXXXXX
    return /^(\+251|0)[79]\d{8}$/.test(phone);
}

/**
 * Validate transaction code format
 */
export function isValidTransactionCode(code) {
    // Alphanumeric, 6-20 characters
    return /^[A-Z0-9]{6,20}$/.test(code);
}

// ==================== EXPORT ====================

export default {
    // Fraud Detection
    detectReferralFraud,
    detectDepositFraud,
    detectPurchaseFraud,

    // Sanitization
    sanitizeInput,
    validateFileUpload,

    // Logging
    logSuspiciousActivity,

    // Rate Limiting
    getStrictRateLimit,

    // Validation
    isValidEthereumAddress,
    isValidEthiopianPhone,
    isValidTransactionCode,
};
