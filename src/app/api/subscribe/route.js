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
        const user = await requireAuth(request);
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user._id;

        await connectDB();

        // Get user with balance (re-fetch with session)
        const userDoc = await User.findById(userId).session(session);

        if (!userDoc) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if already subscribed
        if (userDoc.subscriptionExpiresAt && userDoc.subscriptionExpiresAt > new Date()) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                {
                    error: 'Already subscribed',
                    expiresAt: userDoc.subscriptionExpiresAt,
                },
                { status: 400 }
            );
        }

        // Check balance
        if (userDoc.balance < SUBSCRIPTION_PRICE_CENTS) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                {
                    error: 'Insufficient balance',
                    required: SUBSCRIPTION_PRICE_CENTS,
                    available: userDoc.balance,
                },
                { status: 402 }
            );
        }

        const beforeBalance = userDoc.balance;

        // Deduct balance
        userDoc.balance -= SUBSCRIPTION_PRICE_CENTS;

        // Set subscription expiry (30 days from now or extend existing)
        const now = new Date();
        const currentExpiry = userDoc.subscriptionExpiresAt && userDoc.subscriptionExpiresAt > now
            ? userDoc.subscriptionExpiresAt
            : now;

        userDoc.subscriptionExpiresAt = new Date(currentExpiry.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

        await userDoc.save({ session });

        // Create transaction record
        const transaction = await Transaction.create([{
            userId: userId,
            type: 'subscription',
            status: 'approved',
            amount: SUBSCRIPTION_PRICE_CENTS,
            beforeBalance,
            afterBalance: userDoc.balance,
            approvedAt: new Date(),
            metadata: {
                subscriptionDuration: SUBSCRIPTION_DURATION_DAYS,
                expiresAt: userDoc.subscriptionExpiresAt,
            }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
            success: true,
            message: 'Subscription activated',
            subscription: {
                expiresAt: userDoc.subscriptionExpiresAt,
                durationDays: SUBSCRIPTION_DURATION_DAYS,
                price: SUBSCRIPTION_PRICE_CENTS,
            },
            newBalance: userDoc.balance,
            transaction: transaction[0],
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Subscribe error:', err);
        console.error('Error stack:', err.stack);

        let status = 500;
        let message = 'Failed to process subscription';

        // Handle specific error types
        if (err.name === 'ValidationError') {
            status = 400;
            message = err.message;
        } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
            // MongoDB/transaction specific errors
            if (err.code === 20) {
                // Transaction numbers are only allowed on a replica set member or mongos
                message = 'Database transactions not supported (replica set required)';
            } else {
                message = `Database error: ${err.message}`;
            }
        } else if (err.message) {
            message = err.message;
        }

        return NextResponse.json(
            { error: message, details: process.env.NODE_ENV === 'development' ? err.stack : undefined },
            { status: status }
        );
    }
}

export async function GET(request) {
    try {
        const user = await requireAuth(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const userDoc = await User.findById(user._id);

        const isActive = userDoc.subscriptionExpiresAt && userDoc.subscriptionExpiresAt > new Date();

        return NextResponse.json({
            success: true,
            subscription: {
                active: isActive,
                expiresAt: userDoc.subscriptionExpiresAt,
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
