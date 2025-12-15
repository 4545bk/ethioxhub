/**
 * Authentication Utilities
 * JWT token generation, validation, and password hashing
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    console.warn('⚠️  JWT secrets not configured. Please set JWT_SECRET and JWT_REFRESH_SECRET in .env');
}

/**
 * Generate access token (short-lived)
 * @param {string} userId - User ID
 * @param {string[]} roles - User roles
 * @returns {string} JWT token
 */
export function generateAccessToken(userId, roles = ['user']) {
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '24h';

    return jwt.sign(
        {
            userId,
            roles,
            type: 'access',
        },
        JWT_SECRET,
        {
            expiresIn,
            issuer: 'ethioxhub',
            audience: 'ethioxhub-api',
        }
    );
}

/**
 * Generate refresh token (long-lived)
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export function generateRefreshToken(userId) {
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '30d';

    return jwt.sign(
        {
            userId,
            type: 'refresh',
        },
        JWT_REFRESH_SECRET,
        {
            expiresIn,
            issuer: 'ethioxhub',
            audience: 'ethioxhub-api',
        }
    );
}

/**
 * Generate playback token for VIP videos (short-lived)
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {string} JWT token
 */
export function generatePlaybackToken(userId, videoId) {
    const expiresIn = process.env.PLAYBACK_TOKEN_EXPIRY || '15m';

    return jwt.sign(
        {
            userId,
            videoId,
            type: 'playback',
        },
        JWT_SECRET,
        {
            expiresIn,
            issuer: 'ethioxhub',
        }
    );
}

/**
 * Generate admin callback token for Telegram notifications
 * @param {string} txId - Transaction ID
 * @param {string} action - approve | reject
 * @returns {string} JWT token
 */
export function generateAdminCallbackToken(txId, action) {
    const expiresIn = process.env.ADMIN_CALLBACK_TOKEN_EXPIRY || '1h';

    return jwt.sign(
        {
            txId,
            action,
            type: 'admin-callback',
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_SECRET,
        {
            expiresIn,
            issuer: 'ethioxhub',
        }
    );
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @param {string} type - Token type: 'access' | 'refresh' | 'playback' | 'admin-callback'
 * @returns {object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token, type = 'access') {
    try {
        const secret = type === 'refresh' ? JWT_REFRESH_SECRET : JWT_SECRET;
        const decoded = jwt.verify(token, secret, {
            issuer: 'ethioxhub',
        });

        // Verify token type matches
        if (decoded.type !== type) {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        if (err.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw err;
    }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    return bcrypt.hash(password, rounds);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} True if match
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

/**
 * Extract token from Authorization header or cookie
 * @param {Request} request - Next.js request object
 * @returns {string|null} Token or null
 */
export function extractToken(request) {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Try cookie (for refresh tokens)
    const cookies = request.headers.get('cookie');
    if (cookies) {
        const match = cookies.match(/refreshToken=([^;]+)/);
        if (match) {
            return match[1];
        }
    }

    return null;
}
