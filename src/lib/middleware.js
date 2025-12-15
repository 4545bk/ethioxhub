/**
 * Authentication Middleware
 * Protect API routes and verify user roles
 */

import { verifyToken } from './auth';
import User from '@/models/User';
import connectDB from './db';

/**
 * Middleware to verify JWT and attach user to request
 * Usage in API routes:
 * 
 * export async function GET(request) {
 *   const user = await requireAuth(request);
 *   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   // ... rest of handler
 * }
 */
export async function requireAuth(request) {
    try {
        // Extract token from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = verifyToken(token, 'access');

        // Get user from database
        await connectDB();
        const user = await User.findById(decoded.userId).select('-passwordHash');

        if (!user) {
            return null;
        }

        // Check if user is banned
        if (user.banned) {
            throw new Error('User is banned');
        }

        return user;
    } catch (err) {
        console.error('Auth error:', err.message);
        return null;
    }
}

/**
 * Middleware to verify admin role
 */
export async function requireAdmin(request) {
    const user = await requireAuth(request);

    if (!user) {
        return { error: 'Unauthorized', status: 401 };
    }

    if (!user.hasRole('admin') || user.email !== 'abebe@gmail.com') {
        console.error(`⛔ Access denied for user ${user._id}: Roles=${user.roles}, Email=${user.email}`);
        return { error: 'Forbidden: Admin access required', status: 403 };
    }

    return { user };
}

/**
 * Middleware to verify moderator or admin role
 */
export async function requireModerator(request) {
    const user = await requireAuth(request);

    if (!user) {
        return { error: 'Unauthorized', status: 401 };
    }

    if (!user.hasRole('admin') && !user.hasRole('moderator')) {
        return { error: 'Forbidden: Moderator access required', status: 403 };
    }

    return { user };
}

/**
 * Extract user from request without requiring auth
 * Returns null if not authenticated, doesn't throw error
 */
export async function getOptionalUser(request) {
    try {
        return await requireAuth(request);
    } catch (err) {
        return null;
    }
}
