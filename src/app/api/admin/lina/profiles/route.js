import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LinaProfile from '@/models/LinaProfile';
import { requireAdmin } from '@/lib/middleware';

export async function GET(request) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        await connectDB();

        const profiles = await LinaProfile.find().sort({ createdAt: -1 });

        // Calculate some simple stats or just return raw data
        return NextResponse.json({
            success: true,
            profiles
        });
    } catch (error) {
        console.error('Error fetching admin lina profiles:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
