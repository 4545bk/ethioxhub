/**
 * Get Pending Moderation Videos API
 * GET /api/admin/videos/pending
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import { requireModerator } from '@/lib/middleware';
import { paginationSchema } from '@/lib/validation';

export async function GET(request) {
    try {
        const authResult = await requireModerator(request);

        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        const { searchParams } = new URL(request.url);
        const validation = paginationSchema.safeParse({
            page: searchParams.get('page'),
            limit: searchParams.get('limit'),
        });

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid query parameters' },
                { status: 400 }
            );
        }

        const { page, limit } = validation.data;

        await connectDB();

        const [videos, total] = await Promise.all([
            Video.find({ status: 'pending_moderation' })
                .sort({ createdAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('owner', 'username email'),
            Video.countDocuments({ status: 'pending_moderation' }),
        ]);

        return NextResponse.json({
            success: true,
            videos: videos.map(v => ({
                id: v._id,
                title: v.title,
                description: v.description,
                thumbnailUrl: v.thumbnailUrl,
                duration: v.duration,
                visibility: v.visibility,
                price: v.displayPrice,
                owner: {
                    id: v.owner._id,
                    username: v.owner.username,
                    email: v.owner.email,
                },
                moderationFlags: v.moderationFlags,
                createdAt: v.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Get pending videos error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
