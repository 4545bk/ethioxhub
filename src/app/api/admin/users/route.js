import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/middleware';

export async function GET(request) {
    try {
        const auth = await requireAdmin(request);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        await connectDB();

        // Fetch all users, excluding passwords
        // Sort by newest first
        const users = await User.find({})
            .select('-passwordHash')
            .sort({ createdAt: -1 });

        return NextResponse.json({ users });
    } catch (err) {
        console.error('Fetch users error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
