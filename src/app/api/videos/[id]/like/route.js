/**
 * Like Video API
 * POST /api/videos/[id]/like
 * 
 * Toggle like on video (remove if already liked)
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import { requireAuth } from '@/lib/middleware';

export async function POST(request, { params }) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const videoId = params.id;
        const userId = user._id;

        await connectDB();

        const video = await Video.findById(videoId);

        if (!video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        const alreadyLiked = video.likedBy.includes(userId);
        const alreadyDisliked = video.dislikedBy.includes(userId);

        let updateQuery = {};

        if (alreadyLiked) {
            // Remove like
            updateQuery = {
                $pull: { likedBy: userId },
                $inc: { likesCount: -1 }
            };
        } else {
            // Add like
            updateQuery = {
                $addToSet: { likedBy: userId },
                $inc: { likesCount: 1 }
            };

            // Remove dislike if exists
            if (alreadyDisliked) {
                updateQuery.$pull = { dislikedBy: userId };
                updateQuery.$inc.dislikesCount = -1;
            }
        }

        const updatedVideo = await Video.findByIdAndUpdate(videoId, updateQuery, { new: true });

        return NextResponse.json({
            success: true,
            liked: !alreadyLiked,
            likesCount: updatedVideo.likesCount,
            dislikesCount: updatedVideo.dislikesCount,
        });

    } catch (err) {
        console.error('Like video error:', err);
        return NextResponse.json(
            { error: 'Failed to like video' },
            { status: 500 }
        );
    }
}
