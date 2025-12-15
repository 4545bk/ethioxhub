/**
 * Delete Comment API
 * DELETE /api/comments/[id]
 * 
 * Owner or admin can delete comments
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/models/Comment';
import Video from '@/models/Video';
import { requireAuth } from '@/lib/middleware';

export async function DELETE(request, { params }) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) {
            return NextResponse.json(authResult, { status: authResult.status });
        }

        const commentId = params.id;

        await connectDB();

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            );
        }

        // Check if user is owner or admin
        const isOwner = comment.userId.toString() === authResult.user._id.toString();
        const isAdmin = authResult.user.roles.includes('admin');

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Soft delete
        comment.deleted = true;
        await comment.save();

        // Decrement video comments count
        await Video.findByIdAndUpdate(comment.videoId, {
            $inc: { commentsCount: -1 }
        });

        // If reply, decrement parent replies count
        if (comment.parentId) {
            await Comment.findByIdAndUpdate(comment.parentId, {
                $inc: { repliesCount: -1 }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Comment deleted',
        });

    } catch (err) {
        console.error('Delete comment error:', err);
        return NextResponse.json(
            { error: 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
