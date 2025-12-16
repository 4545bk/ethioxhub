/**
 * Approve Deposit API
 * POST /api/admin/deposits/approve
 * 
 * CRITICAL MONEY-HANDLING ENDPOINT
 * 
 * This endpoint atomically:
 * 1. Verifies admin token and permissions
 * 2. Updates transaction status to 'approved'
 * 3. Credits user balance
 * 4. Logs admin action
 * 
 * All operations are wrapped in a MongoDB transaction to ensure atomicity.
 * If any step fails, all changes are rolled back.
 * 
 * SECURITY:
 * - Requires admin role OR valid signed callback token
 * - Token expires after 1 hour
 * - Uses MongoDB session with snapshot isolation
 * - Logs all actions for audit trail
 */

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import AdminLog from '@/models/AdminLog';
import { requireAdmin, requireAuth } from '@/lib/middleware';
import { verifyToken } from '@/lib/auth';
import { approveDepositSchema } from '@/lib/validation';
import { sendConfirmation } from '@/lib/telegram';

export async function POST(request) {
    let session = null;

    try {
        // Parse request body
        const body = await request.json();
        const validation = approveDepositSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { txId, adminNote, token } = validation.data;

        // Verify token first (for Telegram callbacks)
        let tokenPayload = null;
        try {
            tokenPayload = verifyToken(token, 'admin-callback');
            if (tokenPayload.txId !== txId || tokenPayload.action !== 'approve') {
                throw new Error('Invalid token for this transaction');
            }
        } catch (tokenErr) {
            // Token invalid - proceed to check admin session
        }

        // Authentication Check
        let adminUser = null;
        if (!tokenPayload) {
            // No valid token, strict admin check required
            const authResult = await requireAdmin(request);
            if (authResult.error) {
                return NextResponse.json(
                    { error: authResult.error },
                    { status: authResult.status }
                );
            }
            adminUser = authResult.user;
        } else {
            // Valid token, try to identify user (optional)
            adminUser = await requireAuth(request);
            if (!adminUser || !adminUser.hasRole('admin')) {
                adminUser = null; // System processed
            }
        }

        await connectDB();

        // START TRANSACTION
        session = await mongoose.startSession();
        session.startTransaction();

        try {
            const transaction = await Transaction.findById(txId).session(session);

            if (!transaction) throw new Error('Transaction not found');
            if (transaction.status !== 'pending') throw new Error(`Transaction already ${transaction.status}`);
            if (transaction.type !== 'deposit') throw new Error('Not a deposit transaction');

            // Find User
            const user = await User.findById(transaction.userId).session(session);
            if (!user) throw new Error('User not found');

            // Update Transaction
            transaction.status = 'approved';
            transaction.processedBy = adminUser?._id || null;
            transaction.processedAt = new Date();
            if (adminNote) transaction.adminNote = adminNote;

            await transaction.save({ session });

            // Update User Balance AND Add Notification
            const updatedUser = await User.findByIdAndUpdate(
                transaction.userId,
                {
                    $inc: { balance: transaction.amount },
                    $push: {
                        notifications: {
                            type: 'success',
                            message: `✅ Deposit approved! ${(transaction.amount / 100).toFixed(2)} ETB has been added to your wallet.`,
                            read: false,
                            createdAt: new Date()
                        }
                    }
                },
                { new: true, session }
            );

            // Log Action
            await AdminLog.create([{
                adminId: adminUser?._id || null,
                action: 'approve-deposit',
                targetType: 'transaction',
                targetId: transaction._id,
                metadata: {
                    amount: transaction.amount,
                    userId: updatedUser._id,
                    newBalance: updatedUser.balance,
                    tokenUsed: !!tokenPayload
                },
            }], { session });

            // Commit
            await session.commitTransaction();

            // Send Telegram Notification (Non-blocking or safely caught)
            try {
                const displayAmount = (transaction.amount / 100).toFixed(2);
                await sendConfirmation(
                    `Deposit approved: ${displayAmount} ETB credited to ${user.username}`
                );
            } catch (tgErr) {
                console.error('Telegram notification failed:', tgErr);
            }

            // Return Success
            return NextResponse.json({
                success: true,
                message: 'Deposit approved and user balance updated',
                transaction: {
                    id: transaction._id.toString(),
                    amount: transaction.amount,
                    status: 'approved',
                    user: {
                        id: user._id.toString(),
                        username: user.username,
                        newBalance: updatedUser.balance
                    }
                }
            });

        } catch (txError) {
            await session.abortTransaction();
            throw txError;
        }

    } catch (error) {
        console.error('SERVER ERROR [Approve Deposit]:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    } finally {
        if (session) session.endSession();
    }
}
