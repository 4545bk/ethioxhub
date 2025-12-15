/**
 * Dislike Video API
 * POST /api/videos/[id]/dislike
 * 
 * Toggle dislike on video (remove if already disliked)
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

        if (alreadyDisliked) {
            // Remove dislike
            updateQuery = {
                $pull: { dislikedBy: userId },
                $inc: { dislikesCount: -1 }
            };
        } else {
            // Add dislike
            updateQuery = {
                $addToSet: { dislikedBy: userId },
                $inc: { dislikesCount: 1 }
            };

            // Remove like if exists
            if (alreadyLiked) {
                updateQuery.$pull = { likedBy: userId };
                updateQuery.$inc.likesCount = -1;
            }
        }

        const updatedVideo = await Video.findByIdAndUpdate(videoId, updateQuery, { new: true });

        return NextResponse.json({
            success: true,
            disliked: !alreadyDisliked,
            likesCount: updatedVideo.likesCount,
            dislikesCount: updatedVideo.dislikesCount,
        });

    } catch (err) {
        console.error('Dislike video error:', err);
        return NextResponse.json(
            { error: 'Failed to dislike video' },
            { status: 500 }
        );
    }
}
