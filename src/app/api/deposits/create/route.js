/**
 * Create Deposit Request API
 * POST /api/deposits/create
 * 
 * CRITICAL: This endpoint creates a pending deposit transaction and sends
 * Telegram notification to admin. The actual balance credit happens in the
 * approve endpoint using an atomic MongoDB transaction.
 * 
 * SECURITY: Rate limited to prevent spam, validates all inputs
 */

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware';
import { createDepositSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';
import { generateAdminCallbackToken } from '@/lib/auth';
import { sendDepositNotification } from '@/lib/telegram';

export async function POST(request) {
    try {
        const user = await requireAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate limiting (5 per hour)
        const rateCheck = checkRateLimit(user._id.toString(), 'deposits/create');

        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Too many deposit requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
                    },
                }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = createDepositSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { amount, cloudinaryUrl, cloudinaryId, metadata, senderName } = validation.data;

        // Connect to database
        await connectDB();

        // Create pending transaction
        const transaction = await Transaction.create({
            userId: user._id,
            amount,
            currency: 'ETB',
            type: 'deposit',
            status: 'pending',
            cloudinaryUrl,
            cloudinaryId,
            senderName,
            metadata: metadata || {},
        });

        // Populate user for Telegram notification
        await transaction.populate('userId', 'username email');

        // Generate admin callback tokens (separate for approve/reject)
        const approveToken = generateAdminCallbackToken(transaction._id.toString(), 'approve');
        const rejectToken = generateAdminCallbackToken(transaction._id.toString(), 'reject');

        // Send Telegram notification to admin
        try {
            console.log('🚀 Sending deposit notification to Telegram...');
            console.log('Transaction:', JSON.stringify({
                id: transaction._id,
                amount: transaction.amount,
                cloudinaryUrl: transaction.cloudinaryUrl,
            }, null, 2));

            await sendDepositNotification(transaction, user, approveToken, rejectToken);
        } catch (telegramErr) {
            // Log error but don't fail the request
            console.error('❌ Telegram notification failed:', telegramErr);
        }

        return NextResponse.json({
            success: true,
            message: 'Deposit request submitted successfully. Please wait for admin approval.',
            transaction: {
                id: transaction._id,
                amount: transaction.amount,
                displayAmount: transaction.displayAmount,
                status: transaction.status,
                createdAt: transaction.createdAt,
            },
        }, { status: 201 });
    } catch (err) {
        console.error('Create deposit error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
