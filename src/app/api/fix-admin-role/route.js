
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        let user;
        if (email) {
            user = await User.findOne({ email });
        } else {
            // Try to identify from token if possible, or just fail
            // We can't use requireAuth if we want to fix a user who can't login? 
            // But they ARE logged in, just 403 on admin routes.
            // So we can use requireAuth.
            try {
                user = await requireAuth(request);
            } catch (e) { }
        }

        if (!user && !email) {
            return NextResponse.json({ error: 'Provide email param or login' }, { status: 400 });
        }

        // If we found a user (either by token or email)
        // If query param email is provided, prioritize looking that up (admin fixing another)
        if (email && (!user || user.email !== email)) {
            user = await User.findOne({ email });
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.roles.includes('admin')) {
            user.roles.push('admin');
            await user.save();
            return NextResponse.json({ success: true, message: `User ${user.email} is now Admin. Refresh page.` });
        }

        return NextResponse.json({ success: true, message: `User ${user.email} is already Admin.` });

    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
