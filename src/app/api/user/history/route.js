/**
 * Watch History API
 * GET /api/user/history - Get history
 * DELETE /api/user/history - Clear history
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import WatchHistory from '@/models/WatchHistory';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user._id;
        const { searchParams } = new URL(request.url);
        // Default limit 20 as requested by user
        const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 50);
        const page = parseInt(searchParams.get('page')) || 1;

        await connectDB();

        const { history, total } = await WatchHistory.getUserHistory(userId, page, limit);

        return NextResponse.json({
            success: true,
            history,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error('Get history error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch history' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user._id;

        await connectDB();

        await WatchHistory.deleteMany({ userId });

        return NextResponse.json({
            success: true,
            message: 'History cleared',
        });

    } catch (err) {
        console.error('Clear history error:', err);
        return NextResponse.json(
            { error: 'Failed to clear history' },
            { status: 500 }
        );
    }
}
