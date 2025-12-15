/**
 * Get Playback Token API
 * GET /api/videos/[id]/playtoken
 * 
 * Returns a time-limited signed token for HLS playback
 * Only for users who have access to the video
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import { requireAuth } from '@/lib/middleware';
import { generatePlaybackToken } from '@/lib/auth';
import { generateSignedHlsUrl } from '@/lib/cloudinary';

export async function GET(request, { params }) {
    try {
        const { id: videoId } = params;

        const user = await requireAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Connect to database
        await connectDB();

        // Get video
        const video = await Video.findById(videoId);

        if (!video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        // Check access
        const hasAccess = await video.canAccess(user._id);

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Access denied. Purchase required.' },
                { status: 403 }
            );
        }

        // Generate playback token (JWT)
        const playToken = generatePlaybackToken(user._id.toString(), videoId);

        // Generate signed Cloudinary HLS URL
        const signedUrl = generateSignedHlsUrl(video.cloudinaryPublicId, 900); // 15 min expiry

        // Increment view count (async, don't wait)
        video.incrementViews().catch(err => {
            console.error('Failed to increment views:', err);
        });

        return NextResponse.json({
            success: true,
            playToken,
            hlsUrl: signedUrl,
            video: {
                id: video._id,
                title: video.title,
                duration: video.duration,
            },
            expiresIn: 900, // seconds
        });
    } catch (err) {
        console.error('Get play token error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
