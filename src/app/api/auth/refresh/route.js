/**
 * Token Refresh API Route
 * POST /api/auth/refresh
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyToken, generateAccessToken } from '@/lib/auth';

export async function POST(request) {
    try {
        // Get refresh token from cookie or body
        let refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            try {
                const body = await request.json();
                refreshToken = body.refreshToken;
            } catch (e) {
                // Ignore json parse error if body is empty
            }
        }

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token provided' },
                { status: 401 }
            );
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = verifyToken(refreshToken, 'refresh');
        } catch (err) {
            return NextResponse.json(
                { error: err.message },
                { status: 401 }
            );
        }

        // Connect to database
        await connectDB();

        // Get user and verify still exists and not banned
        const user = await User.findById(decoded.userId).select('-passwordHash');

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 401 }
            );
        }

        if (user.banned) {
            return NextResponse.json(
                { error: 'Account has been banned' },
                { status: 403 }
            );
        }

        // Generate new access token
        const accessToken = generateAccessToken(user._id.toString(), user.roles);

        return NextResponse.json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance,
                roles: user.roles,
            },
        });
    } catch (err) {
        console.error('Refresh error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
