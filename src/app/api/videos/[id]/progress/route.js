/**
 * Watch Progress API
 * POST /api/videos/[id]/progress - Save progress
 * GET /api/videos/[id]/progress - Get progress
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import WatchProgress from '@/models/WatchProgress';
import WatchHistory from '@/models/WatchHistory';
import { requireAuth } from '@/lib/middleware';
import { z } from 'zod';

const progressSchema = z.object({
    progressPercent: z.number().min(0).max(100),
    lastPositionSec: z.number().min(0),
    watchDurationSec: z.number().min(0).optional(),
});

export async function POST(request, { params }) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const videoId = params.id;
        const userId = user._id;
        const body = await request.json();

        const validation = progressSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        await connectDB();

        const { progressPercent, lastPositionSec, watchDurationSec } = validation.data;
        const completed = progressPercent >= 90; // Consider completed if 90%+ watched

        // Upsert watch progress
        const progress = await WatchProgress.findOneAndUpdate(
            { userId, videoId },
            {
                progressPercent,
                lastPositionSec,
                lastSeenAt: new Date(),
                completed,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Add to watch history (maintains 500 limit automatically)
        await WatchHistory.addWatch(userId, videoId, watchDurationSec || 0);

        return NextResponse.json({
            success: true,
            progress,
        });

    } catch (err) {
        console.error('Save progress error:', err);
        return NextResponse.json(
            { error: 'Failed to save progress' },
            { status: 500 }
        );
    }
}

export async function GET(request, { params }) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const videoId = params.id;
        const userId = user._id;

        await connectDB();

        const progress = await WatchProgress.findOne({ userId, videoId });

        if (!progress) {
            return NextResponse.json({
                success: true,
                progress: null,
            });
        }

        return NextResponse.json({
            success: true,
            progress,
        });

    } catch (err) {
        console.error('Get progress error:', err);
        return NextResponse.json(
            { error: 'Failed to get progress' },
            { status: 500 }
        );
    }
}
