/**
 * Polar.sh Webhook Handler
 * POST /api/polar/webhook
 * 
 * PURPOSE: The ONLY place where Polar payments credit the wallet
 * SECURITY: Verifies webhook signature to prevent fraud
 * ATOMICITY: Uses MongoDB transactions to ensure all-or-nothing updates
 * IDEMPOTENCY: Prevents double-crediting via unique constraint on Transaction.idempotencyKey
 * 
 * INTEGRATION: Additive - creates new Transaction records using existing schema
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { sendConfirmation } from '@/lib/telegram';

/**
 * Verify Polar webhook signature
 * Protects against unauthorized requests
 */
function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

export async function POST(request) {
    let session = null;

    try {
        // Get raw body for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get('polar-signature');

        if (!signature) {
            console.error('❌ Missing webhook signature');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify signature
        const isValid = verifyWebhookSignature(
            rawBody,
            signature,
            process.env.POLAR_WEBHOOK_SECRET
        );

        if (!isValid) {
            console.error('❌ Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(rawBody);
        console.log('✅ Polar webhook received:', event.type);

        // Only process successful order payments
        if (event.type !== 'order.created' || event.data?.status !== 'succeeded') {
            return NextResponse.json({ received: true });
        }

        const order = event.data;
        const userId = order.metadata?.ethioxhub_user_id;

        if (!userId) {
            console.error('❌ Missing user ID in webhook', order);
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        // Extract amount (Polar uses cents like us)
        const amountInCents = order.amount;

        if (!amountInCents || amountInCents <= 0) {
            console.error('❌ Invalid amount:', amountInCents);
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        await connectDB();

        // START ATOMIC TRANSACTION
        session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find user
            const user = await User.findById(userId).session(session);
            if (!user) {
                throw new Error('User not found');
            }

            // Create idempotency key to prevent double-processing
            const idempotencyKey = `polar_${order.id}`;

            // Check if already processed
            const existingTx = await Transaction.findOne({ idempotencyKey }).session(session);
            if (existingTx) {
                console.log('⚠️ Duplicate webhook, skipping:', idempotencyKey);
                await session.abortTransaction();
                return NextResponse.json({ received: true, duplicate: true });
            }

            // Create Transaction record (same schema as manual deposits)
            const transaction = await Transaction.create([{
                userId: user._id,
                amount: amountInCents,
                currency: 'USD', // Polar uses USD via Stripe
                type: 'deposit',
                status: 'approved', // Auto-approved since payment succeeded
                idempotencyKey,
                metadata: {
                    source: 'polar',
                    orderId: order.id,
                    polarCustomerEmail: order.customer_email,
                    notes: 'International card payment via Polar.sh',
                },
            }], { session });

            // Credit user wallet
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                {
                    $inc: { balance: amountInCents },
                    $push: {
                        notifications: {
                            type: 'success',
                            message: `✅ Deposit successful! $${(amountInCents / 100).toFixed(2)} USD has been added to your wallet.`,
                            link: '/my-deposits',
                            read: false,
                            createdAt: new Date(),
                        },
                    },
                },
                { new: true, session }
            );

            // Commit transaction
            await session.commitTransaction();

            console.log('✅ Polar deposit processed:', {
                user: user.username,
                amount: amountInCents,
                newBalance: updatedUser.balance,
            });

            // Send Telegram notification (non-blocking)
            try {
                const displayAmount = (amountInCents / 100).toFixed(2);
                await sendConfirmation(
                    `💳 Polar Deposit: $${displayAmount} USD credited to ${user.username}\nNew Balance: ${(updatedUser.balance / 100).toFixed(2)} ETB`
                );
            } catch (tgErr) {
                console.error('Telegram notification failed:', tgErr);
            }

            return NextResponse.json({
                success: true,
                message: 'Deposit processed',
            });

        } catch (txError) {
            await session.abortTransaction();
            throw txError;
        }

    } catch (error) {
        console.error('❌ Polar webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    } finally {
        if (session) session.endSession();
    }
}
