import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export async function POST(request) {
    try {
        await connectDB();

        const body = await request.json();
        const { type, page, sessionId, userId, visitorId, isNewVisitor } = body;

        // Get client info
        const userAgent = request.headers.get('user-agent') || '';
        const referrer = request.headers.get('referer') || '';
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // Get location from Vercel geo headers (free, automatic)
        const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
        const city = request.headers.get('x-vercel-ip-city') || 'Unknown';
        const region = request.headers.get('x-vercel-ip-country-region') || '';

        // Create analytics event
        const event = await AnalyticsEvent.create({
            type: type || 'page_view',
            page,
            sessionId,
            userId: userId || null,
            userAgent,
            referrer,
            ip,
            country,
            city,
            metadata: {
                ...body.metadata,
                region,
                visitorId: visitorId || null,
                isNewVisitor: isNewVisitor || false
            }
        });

        return NextResponse.json({ success: true, eventId: event._id });

    } catch (error) {
        console.error('Analytics tracking error:', error);
        // Don't fail the request, just log
        return NextResponse.json({ success: false }, { status: 200 });
    }
}
