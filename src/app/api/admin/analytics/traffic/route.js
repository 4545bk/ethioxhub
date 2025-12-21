import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import connectDB from '@/lib/db';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export async function GET(request) {
    try {
        // Verify admin access
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');

        // Calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Connect to database
        await connectDB();

        // Get total page views
        const totalPageViews = await AnalyticsEvent.countDocuments({
            type: 'page_view',
            createdAt: { $gte: startDate }
        });

        // Get unique visitors (unique sessionIds)
        const uniqueVisitors = await AnalyticsEvent.distinct('sessionId', {
            type: 'page_view',
            createdAt: { $gte: startDate }
        });

        // Get total video views
        const totalVideoViews = await AnalyticsEvent.countDocuments({
            type: 'video_view',
            createdAt: { $gte: startDate }
        });

        // Get new vs returning visitors
        const newVisitors = await AnalyticsEvent.countDocuments({
            type: 'page_view',
            createdAt: { $gte: startDate },
            'metadata.isNewVisitor': true
        });

        const returningVisitors = uniqueVisitors.length - newVisitors;

        // Calculate average session duration
        const sessionEndEvents = await AnalyticsEvent.find({
            type: 'session_end',
            createdAt: { $gte: startDate },
            'metadata.duration': { $exists: true, $gt: 0 }
        });

        const avgSessionDuration = sessionEndEvents.length > 0
            ? Math.round(
                sessionEndEvents.reduce((sum, e) => sum + (e.metadata.duration || 0), 0) / sessionEndEvents.length
            )
            : 0;

        // Calculate pages per session
        const pagesPerSession = uniqueVisitors.length > 0
            ? Math.round((totalPageViews / uniqueVisitors.length) * 10) / 10
            : 0;

        // Get live visitors (active in last 2 minutes)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const liveVisitors = await AnalyticsEvent.distinct('sessionId', {
            type: 'page_view',
            createdAt: { $gte: twoMinutesAgo }
        });

        // Get device breakdown from user-agent
        const deviceBreakdown = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$sessionId',
                    userAgent: { $first: '$userAgent' }
                }
            }
        ]);

        const devices = { mobile: 0, desktop: 0, tablet: 0 };
        deviceBreakdown.forEach(session => {
            const ua = (session.userAgent || '').toLowerCase();
            if (/tablet|ipad/i.test(ua)) {
                devices.tablet++;
            } else if (/mobile|android|iphone/i.test(ua)) {
                devices.mobile++;
            } else {
                devices.desktop++;
            }
        });

        // Get traffic sources from referrer
        const trafficSources = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$sessionId',
                    referrer: { $first: '$referrer' }
                }
            }
        ]);

        const sources = { direct: 0, google: 0, social: 0, other: 0 };
        trafficSources.forEach(session => {
            const ref = (session.referrer || '').toLowerCase();
            if (ref === 'direct' || !ref) {
                sources.direct++;
            } else if (ref.includes('google')) {
                sources.google++;
            } else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('instagram') || ref.includes('linkedin')) {
                sources.social++;
            } else {
                sources.other++;
            }
        });

        // Get peak traffic hours (0-23)
        const peakHoursData = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $project: {
                    hour: { $hour: '$createdAt' }
                }
            },
            {
                $group: {
                    _id: '$hour',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Process into 24h array
        const peakHours = Array(24).fill(0);
        peakHoursData.forEach(item => {
            peakHours[item._id] = item.count;
        });

        // Get top videos
        const topVideos = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'video_view',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$page', // Tracking URL (e.g., /watch/123)
                    views: { $sum: 1 },
                    uniqueViewers: { $addToSet: '$sessionId' }
                }
            },
            {
                $project: {
                    _id: 1,
                    views: 1,
                    uniqueViewers: { $size: '$uniqueViewers' }
                }
            },
            { $sort: { views: -1 } },
            { $limit: 5 }
        ]);

        // Get daily breakdown for chart
        const dailyData = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Format daily data for chart
        const chartData = dailyData.map(item => ({
            date: item._id,
            views: item.count
        }));

        // Get top pages
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
            {
                $sort: { views: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Get top countries
        const topCountries = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate },
                    'metadata.country': { $exists: true, $ne: 'Unknown' }
                }
            },
            {
                $group: {
                    _id: '$metadata.country',
                    visitors: { $sum: 1 }
                }
            },
            {
                $sort: { visitors: -1 }
            },
            {
                $limit: 5
            }
        ]);

        // Get top cities
        const topCities = await AnalyticsEvent.aggregate([
            {
                $match: {
                    type: 'page_view',
                    createdAt: { $gte: startDate },
                    'metadata.city': { $exists: true, $ne: 'Unknown' }
                }
            },
            {
                $group: {
                    _id: '$metadata.city',
                    visitors: { $sum: 1 }
                }
            },
            {
                $sort: { visitors: -1 }
            },
            {
                $limit: 5
            }
        ]);

        return NextResponse.json({
            success: true,
            period: {
                days,
                startDate,
                endDate: new Date()
            },
            stats: {
                totalPageViews,
                uniqueVisitors: uniqueVisitors.length,
                totalVideoViews,
                newVisitors,
                returningVisitors,
                avgSessionDuration,
                pagesPerSession,
                liveVisitors: liveVisitors.length
            },
            chartData,
            topPages,
            topCountries,
            topCities,
            devices,
            sources,
            peakHours,
            topVideos
        });

    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
