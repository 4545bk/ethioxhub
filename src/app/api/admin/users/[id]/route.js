import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/middleware';

export async function DELETE(request, { params }) {
    try {
        const auth = await requireAdmin(request);
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { id } = params;
        await connectDB();

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Delete user error:', err);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
