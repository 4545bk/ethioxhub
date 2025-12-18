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

const PLANS = {
    '1-month': { name: 'Monthly', price: 100000, days: 30 },
    '2-month': { name: 'Bi-Monthly', price: 180000, days: 60 },
    '3-month': { name: 'Quarterly', price: 255000, days: 90 }
};

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

        // Parse Plan
        let body = {};
        try {
            body = await request.json();
        } catch (e) { }

        const planKey = body.duration || '1-month';
        const plan = PLANS[planKey];

        if (!plan) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
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
        if (userDoc.balance < plan.price) {
            await session.abortTransaction();
            session.endSession();
            return NextResponse.json(
                {
                    error: 'Insufficient balance',
                    required: plan.price,
                    available: userDoc.balance,
                },
                { status: 402 }
            );
        }

        const beforeBalance = userDoc.balance;

        // Deduct balance
        userDoc.balance -= plan.price;

        // Set subscription expiry
        const now = new Date();
        const currentExpiry = userDoc.subscriptionExpiresAt && userDoc.subscriptionExpiresAt > now
            ? userDoc.subscriptionExpiresAt
            : now;

        userDoc.subscriptionExpiresAt = new Date(currentExpiry.getTime() + plan.days * 24 * 60 * 60 * 1000);
        userDoc.subscriptionPlan = plan.name; // Save Plan Name

        // Add notification to user
        userDoc.notifications.push({
            type: 'success',
            message: `🎉 ${plan.name} subscription activated! Enjoy unlimited access to all content for ${plan.days} days. Your subscription expires on ${userDoc.subscriptionExpiresAt.toLocaleDateString()}.`,
            read: false,
            createdAt: new Date()
        });

        await userDoc.save({ session });

        // Create transaction record
        const transaction = await Transaction.create([{
            userId: userId,
            type: 'subscription',
            status: 'approved',
            amount: plan.price,
            beforeBalance,
            afterBalance: userDoc.balance,
            approvedAt: new Date(),
            metadata: {
                subscriptionDuration: plan.days,
                expiresAt: userDoc.subscriptionExpiresAt,
                plan: plan.name
            }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return NextResponse.json({
            success: true,
            message: 'Subscription activated',
            subscription: {
                expiresAt: userDoc.subscriptionExpiresAt,
                durationDays: plan.days,
                price: plan.price,
                plan: plan.name
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
