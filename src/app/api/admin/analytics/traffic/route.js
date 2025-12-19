import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { requireAdmin } from '@/lib/middleware';

export async function GET(request) {
    try {
        // Check admin auth
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();

        // Get date range from query params (default: last 7 days)
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Total page views in period
        const totalPageViews = await AnalyticsEvent.countDocuments({
            type: 'page_view',
            createdAt: { $gte: startDate }
        });

        // Unique visitors (by sessionId)
        const uniqueVisitors = await AnalyticsEvent.distinct('sessionId', {
            type: 'page_view',
            createdAt: { $gte: startDate }
        });

        // Page views by day
        const pageViewsByDay = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top pages
        const topPages = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$page',
                    views: { $sum: 1 }
                }
            },
            { $sort: { views: -1 } },
            { $limit: 10 }
        ]);

        return NextResponse.json({
            success: true,
            period: `${days} days`,
            stats: {
                totalPageViews,
                uniqueVisitors: uniqueVisitors.length,
                pageViewsByDay,
                topPages
            }
        });

    } catch (error) {
        console.error('Traffic analytics fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch traffic analytics', details: error.message },
            { status: 500 }
        );
    }
}
