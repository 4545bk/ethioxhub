import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get last 5 deposits sorted by updated time (not just created)
        // This ensures if an old deposit gets rejected, it bubbles up
        const deposits = await Transaction.find({
            type: 'deposit',
            userId: user._id
        })
            .sort({ updatedAt: -1 })
            .limit(5);

        return NextResponse.json({
            success: true,
            deposits: deposits.map(d => ({
                _id: d._id,
                amount: d.amount,
                status: d.status,
                updatedAt: d.updatedAt,
                createdAt: d.createdAt
            }))
        });

    } catch (err) {
        console.error('Fetch recent deposits error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
