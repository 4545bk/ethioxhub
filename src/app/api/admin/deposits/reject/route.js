/**
 * Reject Deposit API
 * POST /api/admin/deposits/reject
 * 
 * CRITICAL: Marks deposit as rejected with reason.
 * No balance changes occur.
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import AdminLog from '@/models/AdminLog';
import { requireAdmin, requireAuth } from '@/lib/middleware';
import { verifyToken } from '@/lib/auth';
import { rejectDepositSchema } from '@/lib/validation';
import { sendConfirmation } from '@/lib/telegram';

export async function POST(request) {
    try {
        // Parse request body
        const body = await request.json();
        const validation = rejectDepositSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { txId, adminNote, token } = validation.data;

        // Verify token first
        let tokenPayload = null;
        try {
            tokenPayload = verifyToken(token, 'admin-callback');

            if (tokenPayload.txId !== txId || tokenPayload.action !== 'reject') {
                throw new Error('Invalid token for this transaction');
            }
        } catch (tokenErr) {
            console.error('Token verification failed:', tokenErr.message);
        }

        // If token invalid, require admin auth
        let adminUser = null;
        if (!tokenPayload) {
            const authResult = await requireAdmin(request);
            if (authResult.error) {
                return NextResponse.json(
                    { error: authResult.error },
                    { status: authResult.status }
                );
            }
            adminUser = authResult.user;
        } else {
            adminUser = await requireAuth(request);
            if (!adminUser || !adminUser.hasRole('admin')) {
                adminUser = null;
            }
        }

        // Connect to database
        await connectDB();

        // Find transaction
        const transaction = await Transaction.findById(txId);

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            );
        }

        if (transaction.status !== 'pending') {
            return NextResponse.json(
                { error: `Transaction already ${transaction.status}` },
                { status: 400 }
            );
        }

        // Update transaction
        transaction.status = 'rejected';
        transaction.processedBy = adminUser?._id || null;
        transaction.processedAt = new Date();
        transaction.adminNote = adminNote;
        await transaction.save();

        // Update user notification
        const user = await User.findById(transaction.userId);
        if (user) {
            user.notifications.push({
                type: 'warning',
                message: `❌ Deposit rejected. Your deposit of ${(transaction.amount / 100).toFixed(2)} ETB was not approved. Reason: ${adminNote}`,
                read: false,
                createdAt: new Date()
            });
            await user.save();
        }

        // Log admin action
        await AdminLog.create({
            adminId: adminUser?._id || null,
            action: 'reject-deposit',
            targetType: 'transaction',
            targetId: transaction._id,
            metadata: {
                amount: transaction.amount,
                reason: adminNote,
                tokenUsed: !!tokenPayload,
            },
        });

        // Send Telegram confirmation
        try {
            await sendConfirmation(
                `Deposit rejected: Transaction ${txId.substring(0, 8)}... - Reason: ${adminNote}`
            );
        } catch (telegramErr) {
            console.error('Telegram confirmation failed:', telegramErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Deposit rejected',
            transaction: {
                id: transaction._id,
                status: transaction.status,
                adminNote: transaction.adminNote,
            },
        });
    } catch (err) {
        console.error('Reject deposit error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
