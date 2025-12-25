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
        const socialBreakdown = { telegram: 0, facebook: 0, instagram: 0, tiktok: 0, youtube: 0 };

        trafficSources.forEach(session => {
            const ref = (session.referrer || '').toLowerCase();
            if (ref === 'direct' || !ref) {
                sources.direct++;
            } else if (ref.includes('google')) {
                sources.google++;
            } else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('instagram') || ref.includes('linkedin') || ref.includes('t.me') || ref.includes('tiktok') || ref.includes('youtube')) {
                sources.social++;

                // Detailed breakdown
                if (ref.includes('t.me') || ref.includes('telegram')) socialBreakdown.telegram++;
                if (ref.includes('facebook') || ref.includes('fb.com')) socialBreakdown.facebook++;
                if (ref.includes('instagram')) socialBreakdown.instagram++;
                if (ref.includes('tiktok')) socialBreakdown.tiktok++;
                if (ref.includes('youtube')) socialBreakdown.youtube++;
            } else {
                sources.other++;
            }
        });

        // Conversion Funnel Metrics
        const signups = await AnalyticsEvent.countDocuments({
            type: 'signup_complete',
            createdAt: { $gte: startDate }
        });

        const purchaseStarts = await AnalyticsEvent.countDocuments({
            type: 'purchase_start',
            createdAt: { $gte: startDate }
        });

        const purchases = await AnalyticsEvent.countDocuments({
            type: 'purchase_complete',
            createdAt: { $gte: startDate }
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

        // Calculate Today vs Yesterday for Insights
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(todayStart);

        const todayViews = await AnalyticsEvent.countDocuments({
            type: 'page_view',
            createdAt: { $gte: todayStart }
        });

        const yesterdayViews = await AnalyticsEvent.countDocuments({
            type: 'page_view',
            createdAt: { $gte: yesterdayStart, $lt: yesterdayEnd }
        });

        const growthPercent = yesterdayViews > 0
            ? Math.round(((todayViews - yesterdayViews) / yesterdayViews) * 100)
            : 100;

        // Generate Smart Insights
        const insights = {
            positives: [],
            negatives: [],
            actions: []
        };

        // Positives
        if (growthPercent > 0) insights.positives.push(`Traffic is up ${growthPercent}% compared to yesterday!`);
        if (returningVisitors > uniqueVisitors * 0.3) insights.positives.push('Great retention! >30% returning visitors.');
        if (avgSessionDuration > 180) insights.positives.push('Excellent engagement (Avg session > 3 mins).');
        if (liveVisitors > 5) insights.positives.push(`${liveVisitors} people are online right now!`);

        // Negatives
        if (growthPercent < -10) insights.negatives.push(`Traffic dropped ${Math.abs(growthPercent)}% today.`);
        if (pagesPerSession < 2) insights.negatives.push('Users are leaving after 1 page (High Bounce).');
        if (devices.mobile > devices.desktop * 2 && avgSessionDuration < 60) insights.negatives.push('Mobile users leaving fast. Check mobile speed.');

        // Actions - Smart Strategy Generation

        // 1. Calculate Peak Time
        let maxTraffic = 0;
        let peakHourIndex = 18; // Default to evening
        peakHours.forEach((count, idx) => {
            if (count > maxTraffic) {
                maxTraffic = count;
                peakHourIndex = idx;
            }
        });
        const peakTimeStart = peakHourIndex.toString().padStart(2, '0');
        const peakTimeEnd = ((peakHourIndex + 1) % 24).toString().padStart(2, '0');
        insights.actions.push(`Post content during ${peakTimeStart}:00–${peakTimeEnd}:00 (Your Peak Traffic Time).`);

        // 2. Region Growth Strategies
        const hasUS = topCountries.some(c => c._id === 'US');
        const hasAE = topCountries.some(c => c._id === 'AE'); // UAE/Dubai

        if (!hasUS) insights.actions.push('Target US traffic with weekend posts (High Value Ad Market).');
        else insights.actions.push('US traffic is present. Boost it with English content.');

        if (!hasAE) insights.actions.push('Target Dubai (AE) groups. Diaspora users pay well.');

        // 3. Content Optimization
        if (pagesPerSession < 2.5) {
            insights.actions.push('Improve landing page depth (Add "Related Videos" or "More Photos").');
        }

        // 4. Source Optimization
        if (sources.direct > sources.social * 2) {
            insights.actions.push('Social traffic is low. Share links in 3 new Telegram groups today.');
        }

        // 5. User Retention
        if (returningVisitors < newVisitors * 0.2) {
            insights.actions.push('Retention is low. Create a "Loyalty" offer or Subscriber discount.');
        }

        // Fallbacks
        if (insights.positives.length === 0) insights.positives.push('System is tracking data steadily.');
        if (insights.negatives.length === 0) insights.negatives.push('No critical issues detected today.');
        if (insights.actions.length === 0) insights.actions.push('Keep posting consistently!');

        return NextResponse.json({
            insights, // Add insights to response
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
            funnel: {
                visitors: uniqueVisitors.length,
                signups,
                purchaseStarts,
                purchases
            },
            chartData,
            topPages,
            topCountries,
            topCities,
            devices,
            sources,
            socialBreakdown,
            peakHours,
            topVideos,
            insights // New field
        });

    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
