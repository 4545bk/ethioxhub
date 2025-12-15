/**
 * Approve Video API
 * POST /api/admin/videos/[id]/approve
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import ModerationLog from '@/models/ModerationLog';
import { requireModerator } from '@/lib/middleware';

export async function POST(request, { params }) {
    try {
        const { id: videoId } = params;

        const authResult = await requireModerator(request);

        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const admin = authResult.user;

        await connectDB();

        const video = await Video.findById(videoId);

        if (!video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        video.status = 'approved';
        await video.save();

        await ModerationLog.create({
            videoId: video._id,
            action: 'manual-approve',
            reason: 'Approved by moderator',
            adminId: admin._id,
        });

        return NextResponse.json({
            success: true,
            message: 'Video approved',
        });
    } catch (err) {
        console.error('Approve video error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
