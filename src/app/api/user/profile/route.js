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
        const { profilePicture } = data;

        await connectDB();

        // Update fields
        if (profilePicture !== undefined) user.profilePicture = profilePicture;

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
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
