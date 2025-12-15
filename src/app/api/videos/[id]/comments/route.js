/**
 * Comments API for Video
 * GET /api/videos/[id]/comments - List comments
 * POST /api/videos/[id]/comments - Create comment
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';
import Video from '@/models/Video';
import { requireAuth } from '@/lib/middleware';
import { validateCommentText } from '@/lib/badWordsFilter';
import { z } from 'zod';

const commentSchema = z.object({
    text: z.string().min(1).max(1000),
    parentId: z.string().optional(),
});

export async function GET(request, { params }) {
    try {
        await connectDB();

        const videoId = params.id;
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page')) || 1;
        const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 50);
        const skip = (page - 1) * limit;

        // Get top-level comments (no parent)
        const query = {
            videoId,
            parentId: null,
            deleted: false,
        };

        const [comments, total] = await Promise.all([
            Comment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username')
                .lean(),
            Comment.countDocuments(query)
        ]);

        // Get replies for each comment (limit to 3 most recent per comment)
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await Comment.find({
                    videoId,
                    parentId: comment._id,
                    deleted: false,
                })
                    .sort({ createdAt: 1 })
                    .limit(3)
                    .populate('userId', 'username')
                    .lean();

                const repliesCount = await Comment.countDocuments({
                    videoId,
                    parentId: comment._id,
                    deleted: false,
                });

                return {
                    ...comment,
                    replies,
                    repliesCount,
                };
            })
        );

        return NextResponse.json({
            success: true,
            comments: commentsWithReplies,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (err) {
        console.error('List comments error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

export async function POST(request, { params }) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const videoId = params.id;
        const body = await request.json();
        const validation = commentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify video exists
        const video = await Video.findById(videoId);
        if (!video) {
            return NextResponse.json(
                { error: 'Video not found' },
                { status: 404 }
            );
        }

        // Validate comment text for bad words
        const textValidation = validateCommentText(validation.data.text);

        if (!textValidation.valid) {
            return NextResponse.json(
                { error: textValidation.reason },
                { status: 400 }
            );
        }

        // Create comment
        const commentData = {
            userId: user._id,
            videoId,
            text: textValidation.filtered || validation.data.text,
            parentId: validation.data.parentId || null,
            moderated: textValidation.requiresModeration || false,
        };

        const comment = await Comment.create(commentData);

        // Update video comments count
        await Video.findByIdAndUpdate(videoId, {
            $inc: { commentsCount: 1 }
        });

        // If reply, update parent replies count
        if (commentData.parentId) {
            await Comment.findByIdAndUpdate(commentData.parentId, {
                $inc: { repliesCount: 1 }
            });
        }

        // Populate user data before returning
        await comment.populate('userId', 'username');

        return NextResponse.json({
            success: true,
            comment,
            moderated: textValidation.requiresModeration || false,
        });

    } catch (err) {
        console.error('Create comment error:', err);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
}
