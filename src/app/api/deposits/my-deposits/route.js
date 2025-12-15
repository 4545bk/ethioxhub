/**
 * Get User's Deposits
 * GET /api/deposits/my-deposits
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/middleware';

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        await connectDB();

        const deposits = await Transaction.find({
            userId: user._id,
            type: 'deposit',
        })
            .sort({ createdAt: -1 })
            .select('amount status cloudinaryUrl adminNote senderName metadata createdAt')
            .limit(50);

        return NextResponse.json({
            success: true,
            deposits,
        });
    } catch (err) {
        console.error('Get my deposits error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to fetch deposits' },
            { status: err.status || 500 }
        );
    }
}
