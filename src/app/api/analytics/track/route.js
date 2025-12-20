import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import AnalyticsEvent from '../../../../models/AnalyticsEvent';

export async function POST(request) {
    try {
        const body = await request.json();
        const { type, page, sessionId, userId, metadata } = body;

        // Validate required fields
        if (!type || !page || !sessionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Extract tracking data from headers
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const userAgent = request.headers.get('user-agent') || 'unknown';
        const referrer = request.headers.get('referer') || 'direct';

        // Extract geo-location from headers (Vercel provides these)
        const country = request.headers.get('x-vercel-ip-country') ||
            request.headers.get('cf-ipcountry') ||
            'Unknown';
        const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
        const region = request.headers.get('x-vercel-ip-country-region') || '';

        // Connect to database
        await connectDB();

        // Create analytics event
        const event = await AnalyticsEvent.create({
            type,
            page,
            sessionId,
            userId: userId || null,
            ipAddress,
            userAgent,
            referrer,
            metadata: {
                ...metadata,
                country,
                city,
                region
            }
        });

        return NextResponse.json({
            success: true,
            eventId: event._id
        });

    } catch (error) {
        // Fail silently - analytics should never break the user experience
        console.error('Analytics tracking error:', error);

        // Return success even on error so client doesn't retry
        return NextResponse.json({
            success: true,
            note: 'logged'
        });
    }
}
