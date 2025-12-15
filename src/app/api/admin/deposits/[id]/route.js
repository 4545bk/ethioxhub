import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { requireAdmin } from '@/lib/middleware';

export async function GET(request, { params }) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        await connectDB();

        const { id } = params;
        const transaction = await Transaction.findById(id).populate('userId', 'username email');

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            deposit: {
                id: transaction._id,
                amount: transaction.amount,
                displayAmount: transaction.displayAmount,
                status: transaction.status,
                type: transaction.type,
                cloudinaryUrl: transaction.cloudinaryUrl,
                senderName: transaction.senderName,
                metadata: transaction.metadata,
                createdAt: transaction.createdAt,
                processedAt: transaction.processedAt,
                adminNote: transaction.adminNote,
                user: {
                    id: transaction.userId._id,
                    username: transaction.userId.username,
                    email: transaction.userId.email,
                },
            },
        });
    } catch (err) {
        console.error('Get deposit error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
