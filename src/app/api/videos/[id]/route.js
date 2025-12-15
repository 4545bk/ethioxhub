/**
 * Get Video API
 * GET /api/videos/[id]
 * 
 * Returns video details and access status
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { getS3ViewUrl } from '@/lib/s3';

export async function GET(request, { params }) {
    try {
        await connectDB();
        const video = await Video.findById(params.id).populate('owner', 'username');
        if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

        // Check Access
        let canAccess = false;

        // 1. Is Free?
        if (!video.isPaid) canAccess = true;

        // 2. Auth Check
        else {
            const authHeader = request.headers.get('authorization');
            if (authHeader) {
                // We have a token, get user
                try {
                    const user = await requireAuth(request);
                    if (user) {
                        // A. Is Owner?
                        if (user._id.toString() === video.owner._id.toString()) canAccess = true;
                        // B. Is Admin?
                        else if (user.roles && user.roles.includes('admin')) canAccess = true;
                        // C. Is Subscriber?
                        else if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()) canAccess = true;
                        // D. Is Unlocked?
                        else if (user.unlockedVideos && user.unlockedVideos.includes(video._id)) canAccess = true;
                    }
                } catch (e) {
                    // Ignore auth error, treat as guest if token invalid
                }
            }
        }

        // Determine correct video URL
        let videoUrl = null;
        if (canAccess) {
            if (video.provider === 's3' && video.s3Key) {
                // S3 Signed URL
                videoUrl = await getS3ViewUrl(video.s3Key);
            } else {
                // Cloudinary Fallback
                videoUrl = video.cloudinaryUrl || video.videoUrl;
                if (!videoUrl && video.cloudinaryPublicId) {
                    videoUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${video.cloudinaryPublicId}.mp4`;
                }
            }
        }

        // Return Data
        const responseData = {
            ...video.toObject(),
            videoUrl: videoUrl, // Will be null if !canAccess
            canAccess,
            // Strip internal storage keys from client
            s3Key: undefined,
            s3Bucket: undefined,
            cloudinaryRawUrl: undefined
        };

        // Increment Views (Optimistic, don't await blocking)
        video.incrementViews().catch(console.error);

        return NextResponse.json({ video: responseData, canAccess });

    } catch (err) {
        console.error('Fetch video error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
