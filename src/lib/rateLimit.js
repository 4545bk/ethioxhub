/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter (use Redis for production)
 */

const rateLimits = new Map();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
    'upload/sign': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
    'deposits/create': { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    'videos/create': { maxRequests: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 per day
    'auth/register': { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour (increased for launch)
    'auth/login': { maxRequests: 20, windowMs: 15 * 60 * 1000 }, // 20 per 15 min
    default: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 per 15 min
};

/**
 * Check if request should be rate limited
 * @param {string} identifier - User ID or IP address
 * @param {string} endpoint - Endpoint name
 * @returns {object} { allowed: boolean, resetTime?: number }
 */
export function checkRateLimit(identifier, endpoint) {
    const config = RATE_LIMIT_CONFIG[endpoint] || RATE_LIMIT_CONFIG.default;
    const key = `${endpoint}:${identifier}`;

    const now = Date.now();
    const record = rateLimits.get(key);

    if (!record) {
        // First request
        rateLimits.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return { allowed: true };
    }

    // Check if window has expired
    if (now > record.resetTime) {
        // Reset window
        rateLimits.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
        });
        return { allowed: true };
    }

    // Increment count
    record.count++;

    if (record.count > config.maxRequests) {
        return {
            allowed: false,
            resetTime: record.resetTime,
        };
    }

    return { allowed: true };
}

/**
 * Extract identifier from request (user ID or IP)
 * @param {Request} request - Next.js request
 * @param {object} user - Authenticated user (optional)
 * @returns {string} Identifier
 */
export function getIdentifier(request, user = null) {
    if (user) {
        return user._id.toString();
    }

    // Try to get IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to a generic identifier
    return 'anonymous';
}

/**
 * Cleanup old rate limit records periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimits.entries()) {
        if (now > record.resetTime) {
            rateLimits.delete(key);
        }
    }
}, 5 * 60 * 1000); // Cleanup every 5 minutes
