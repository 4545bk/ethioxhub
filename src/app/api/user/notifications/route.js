import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/middleware';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get notifications array (initialize if not exists)
        const notificationsArray = user.notifications || [];

        // Return notifications sorted by newest first
        const notifications = notificationsArray.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        return NextResponse.json({ notifications });
    } catch (err) {
        console.error('Get notifications error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
