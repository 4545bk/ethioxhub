/**
 * Reject Video API
 * POST /api/admin/videos/[id]/reject
 * Body: { reason: string }
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import ModerationLog from '@/models/ModerationLog';
import { requireModerator } from '@/lib/middleware';
import { z } from 'zod';

const rejectSchema = z.object({
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

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

        const body = await request.json();
        const validation = rejectSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { reason } = validation.data;

        await connectDB();

        const video = await Video.findById(videoId);

        if (!video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        video.status = 'rejected';
        video.rejectionReason = reason;
        await video.save();

        await ModerationLog.create({
            videoId: video._id,
            action: 'manual-reject',
            reason,
            adminId: admin._id,
        });

        return NextResponse.json({
            success: true,
            message: 'Video rejected',
        });
    } catch (err) {
        console.error('Reject video error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
