/**
 * Google Sign-In API Route
 * POST /api/auth/google
 */

import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

export async function POST(request) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json({ error: 'Missing credential' }, { status: 400 });
        }

        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        if (!email || !googleId) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 });
        }

        await connectDB();

        // 2. Find or Create User
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            // User exists: Ensure googleId is set
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = user.authProvider === 'email' ? 'email' : 'google'; // Keep original if exists
                // Optional: Update profile picture if empty
                if (!user.profilePicture) user.profilePicture = picture;
                await user.save();
            }
        } else {
            // Create New User
            // Generate unique username (handle collisions simply for now)
            let baseUsername = name.replace(/\s+/g, '').toLowerCase().slice(0, 15);
            let username = baseUsername;
            let count = 1;

            // Simple check loop (could be optimized)
            while (await User.findOne({ username })) {
                username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
                count++;
            }

            user = await User.create({
                username,
                email: email.toLowerCase(),
                googleId,
                authProvider: 'google',
                profilePicture: picture,
                roles: ['user'],
                verifiedAge: true, // Google usually actively verifies 13+
            });
        }

        if (user.banned) {
            return NextResponse.json({ error: 'Account is banned', reason: user.banReason }, { status: 403 });
        }

        // 3. Issue Tokens (Same as Login)
        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const accessToken = generateAccessToken(user._id.toString(), user.roles);
        const refreshToken = generateRefreshToken(user._id.toString());

        const response = NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance,
                availableBalance: user.availableBalance,
                roles: user.roles,
            },
            accessToken,
        });

        // Set refresh token in HttpOnly cookie
        response.cookies.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        return response;

    } catch (err) {
        console.error('Google Auth Error:', err);
        return NextResponse.json({ error: 'Authentication failed: ' + err.message }, { status: 500 });
    }
}
