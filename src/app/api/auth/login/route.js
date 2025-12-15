/**
 * User Login API Route
 * POST /api/auth/login
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { checkRateLimit, getIdentifier } from '@/lib/rateLimit';

export async function POST(request) {
    try {
        // Rate limiting
        const identifier = getIdentifier(request);
        const rateCheck = checkRateLimit(identifier, 'auth/login');

        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
                    },
                }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = loginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        // Connect to database
        await connectDB();

        // Find user (explicitly select passwordHash)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check if user is banned
        if (user.banned) {
            return NextResponse.json(
                { error: 'Account has been banned', reason: user.banReason },
                { status: 403 }
            );
        }

        // Verify password
        const isValid = await user.comparePassword(password);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString(), user.roles);
        const refreshToken = generateRefreshToken(user._id.toString());

        // Return tokens
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
        console.error('Login error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
