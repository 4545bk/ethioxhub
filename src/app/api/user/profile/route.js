/**
 * User Profile API
 * PUT /api/user/profile - Update user profile (e.g., profile picture)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function PUT(request) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { profilePicture, username } = data;

        await connectDB();

        // Update fields
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

        // Update username if provided
        if (username !== undefined && username.trim() !== '') {
            // Check if username is already taken by another user
            if (username !== user.username) {
                const existingUser = await User.findOne({ username: username });
                if (existingUser) {
                    return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
                }
                user.username = username.trim();
            }
        }

        await user.save();

        return NextResponse.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
            }
        });

    } catch (err) {
        console.error('Profile update error:', err);

        // Handle Mongoose Validation Errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return NextResponse.json({ error: messages[0] }, { status: 400 });
        }

        // Handle Duplicate Key Error (e.g. Username)
        if (err.code === 11000) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }

        return NextResponse.json(
            { error: err.message || 'Failed to update profile' },
            { status: 500 }
        );
    }
}
