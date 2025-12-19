import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';

/**
 * Cron Job Endpoint: Auto-publish scheduled videos
 * Call this endpoint periodically (e.g., every 5 minutes) using Vercel Cron or external service
 * Example: curl -X GET https://yourdomain.com/api/cron/publish-scheduled
 */
export async function GET(request) {
    try {
        // Optional: Add authorization header check for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key'; // Set this in .env

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const now = new Date();

        // Find all scheduled videos whose publish time has arrived
        const scheduledVideos = await Video.find({
            status: 'scheduled',
            scheduledPublishAt: { $lte: now }
        });

        if (scheduledVideos.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No videos to publish',
                published: 0
            });
        }

        // Update all matching videos to approved status
        const updateResult = await Video.updateMany(
            {
                status: 'scheduled',
                scheduledPublishAt: { $lte: now }
            },
            {
                $set: { status: 'approved' }
            }
        );

        return NextResponse.json({
            success: true,
            message: `Published ${updateResult.modifiedCount} scheduled videos`,
            published: updateResult.modifiedCount,
            videoIds: scheduledVideos.map(v => v._id)
        });

    } catch (error) {
        console.error('Cron publish error:', error);
        return NextResponse.json(
            { error: 'Failed to publish scheduled videos', details: error.message },
            { status: 500 }
        );
    }
}
