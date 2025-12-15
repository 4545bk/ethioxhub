/**
 * Get Pending Deposits API
 * GET /api/admin/deposits/pending?page=1&limit=20
 * 
 * Admin endpoint to list all pending deposit requests
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import { requireAdmin } from '@/lib/middleware';
import { paginationSchema } from '@/lib/validation';

export async function GET(request) {
    try {
        const authResult = await requireAdmin(request);

        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        // Parse query params - SAFE PARSING
        const { searchParams } = new URL(request.url);
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

        // Manual parsing to avoid Zod strictness issues with empty strings
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        const limit = limitParam ? parseInt(limitParam, 10) : 20;

        if (isNaN(page) || isNaN(limit)) {
            return NextResponse.json(
                { error: 'Invalid query parameters' },
                { status: 400 }
            );
        }



        // Connect to database
        await connectDB();

        // Get pending deposits
        const [transactions, total] = await Promise.all([
            Transaction.find({ type: 'deposit', status: 'pending' })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('userId', 'username email balance'),
            Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
        ]);

        console.log(`Found ${transactions.length} pending deposits`);

        return NextResponse.json({
            success: true,
            deposits: transactions.map(tx => ({
                id: tx._id,
                amount: tx.amount,
                displayAmount: tx.displayAmount,
                cloudinaryUrl: tx.cloudinaryUrl,
                cloudinaryUrl: tx.cloudinaryUrl,
                senderName: tx.senderName || tx.metadata?.senderName || 'Unknown',
                metadata: tx.metadata,
                user: tx.userId ? {
                    id: tx.userId._id,
                    username: tx.userId.username,
                    email: tx.userId.email,
                    currentBalance: tx.userId.balance / 100,
                } : { username: 'Unknown User', email: 'N/A' },
                createdAt: tx.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('Get pending deposits error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
