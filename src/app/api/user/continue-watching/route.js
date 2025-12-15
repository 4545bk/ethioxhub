/**
 * Continue Watching API
 * GET /api/user/continue-watching
 * 
 * Get user's incomplete videos for "Continue Watching" section
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import WatchProgress from '@/models/WatchProgress';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user._id;
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 50);

        await connectDB();

        // Get incomplete videos (not completed, progress > 5%)
        const continueWatching = await WatchProgress.find({
            userId,
            completed: false,
            progressPercent: { $gt: 5, $lt: 90 },
        })
            .sort({ lastSeenAt: -1 })
            .limit(limit)
            .populate({
                path: 'videoId',
                select: 'title thumbnailUrl duration isPaid price status owner category',
                populate: { path: 'category', select: 'name slug' }
            });

        // Filter out deleted videos
        const validProgress = continueWatching.filter(p => p.videoId && p.videoId.status === 'approved');

        return NextResponse.json({
            success: true,
            continueWatching: validProgress,
        });

    } catch (err) {
        console.error('Continue watching error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch continue watching' },
            { status: 500 }
        );
    }
}
