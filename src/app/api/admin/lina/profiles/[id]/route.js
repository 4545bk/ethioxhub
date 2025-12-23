import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LinaProfile from '@/models/LinaProfile';
import { requireAdmin } from '@/lib/middleware';

// DELETE profile
export async function DELETE(request, { params }) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const profile = await LinaProfile.findByIdAndDelete(params.id);

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting Lina profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update profile (e.g. toggle active status)
export async function PATCH(request, { params }) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        await connectDB();

        const profile = await LinaProfile.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, profile });
    } catch (error) {
        console.error('Error updating Lina profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
