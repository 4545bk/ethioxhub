/**
 * Subscribe API
 * POST /api/subscribe
 * 
 * Monthly subscription: 1000 ETB (100000 cents)
 * Deducts from user balance and sets subscriptionExpiresAt
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { requireAuth } from '@/lib/middleware';
import mongoose from 'mongoose';

const SUBSCRIPTION_PRICE_CENTS = parseInt(process.env.SUBSCRIPTION_PRICE_CENTS) || 100000; // 1000 ETB
const SUBSCRIPTION_DURATION_DAYS = 30;

export async function POST(request) {
    const session = await mongoose.startSession();
    session.startTransaction({
        readConcern: 'snapshot',
        writeConcern: 'majority'
    });

    try {
        const authResult = await requireAuth(request);
        if (authResult.error) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(authResult, { status: authResult.status });
        }

        const userId = authResult.user._id;

        await connectDB();

        // Get user with balance
        const user = await User.findById(userId).session(session);

        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already subscribed
        if (user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date()) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                {
                    error: 'Already subscribed',
                    expiresAt: user.subscriptionExpiresAt,
                },
                { status: 400 }
            );
        }

        // Check balance
        if (user.balance < SUBSCRIPTION_PRICE_CENTS) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                {
                    error: 'Insufficient balance',
                    required: SUBSCRIPTION_PRICE_CENTS,
                    available: user.balance,
                },
                { status: 402 }
            );
        }

        const beforeBalance = user.balance;

        // Deduct balance
        user.balance -= SUBSCRIPTION_PRICE_CENTS;

        // Set subscription expiry (30 days from now or extend existing)
        const now = new Date();
        const currentExpiry = user.subscriptionExpiresAt && user.subscriptionExpiresAt > now
            ? user.subscriptionExpiresAt
            : now;

        user.subscriptionExpiresAt = new Date(currentExpiry.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

        await user.save({ session });

        // Create transaction record
        const transaction = await Transaction.create([{
            user: userId,
            type: 'subscription',
            status: 'approved',
            amount: SUBSCRIPTION_PRICE_CENTS,
            beforeBalance,
            afterBalance: user.balance,
            approvedAt: new Date(),
            metadata: {
                subscriptionDuration: SUBSCRIPTION_DURATION_DAYS,
                expiresAt: user.subscriptionExpiresAt,
            }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
            success: true,
            message: 'Subscription activated',
            subscription: {
                expiresAt: user.subscriptionExpiresAt,
                durationDays: SUBSCRIPTION_DURATION_DAYS,
                price: SUBSCRIPTION_PRICE_CENTS,
            },
            newBalance: user.balance,
            transaction: transaction[0],
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Subscribe error:', err);
        return NextResponse.json(
            { error: 'Failed to process subscription', details: err.message },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const authResult = await requireAuth(request);
        if (authResult.error) {
            return NextResponse.json(authResult, { status: authResult.status });
        }

        await connectDB();

        const user = await User.findById(authResult.user._id);

        const isActive = user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date();

        return NextResponse.json({
            success: true,
            subscription: {
                active: isActive,
                expiresAt: user.subscriptionExpiresAt,
                price: SUBSCRIPTION_PRICE_CENTS,
                durationDays: SUBSCRIPTION_DURATION_DAYS,
            },
        });

    } catch (err) {
        console.error('Get subscription error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch subscription' },
            { status: 500 }
        );
    }
}
