/**
 * Telegram Webhook Handler - FIXED VERSION
 * POST /api/telegram/webhook
 * 
 * Handles inline button callbacks for deposit approve/reject
 * FIXES: Internal Server Error, callback_query handling, atomic transactions
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import AdminLog from '@/models/AdminLog';
import mongoose from 'mongoose';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function POST(request) {
    try {
        const update = await request.json();
        console.log('Telegram webhook received:', JSON.stringify(update, null, 2));

        // Handle callback_query (inline button clicks)
        if (update.callback_query) {
            return await handleCallbackQuery(update.callback_query);
        }

        return NextResponse.json({ ok: true });

    } catch (err) {
        console.error('Telegram webhook error:', err);
        return NextResponse.json(
            { error: 'Webhook processing failed', details: err.message },
            { status: 500 }
        );
    }
}

async function handleCallbackQuery(callbackQuery) {
    const callbackId = callbackQuery.id;
    const chatId = callbackQuery.message?.chat?.id;
    const messageId = callbackQuery.message?.message_id;
    const fromUser = callbackQuery.from;
    const data = callbackQuery.data;

    try {
        console.log('Processing callback:', { callbackId, data, chatId, fromUser });

        // Parse callback data: format "action:txId:token"
        const parts = data.split(':');
        if (parts.length < 3) {
            await answerCallbackQuery(callbackId, '❌ Invalid callback data');
            return NextResponse.json({ ok: false, error: 'Invalid callback data' });
        }

        const [action, txId, token] = parts;

        // Verify this is from admin chat
        if (chatId.toString() !== ADMIN_CHAT_ID) {
            await answerCallbackQuery(callbackId, '❌ Unauthorized');
            return NextResponse.json({ ok: false, error: 'Unauthorized chat' });
        }

        await connectDB();

        // Find transaction
        const transaction = await Transaction.findById(txId);

        if (!transaction) {
            await answerCallbackQuery(callbackId, '❌ Transaction not found');
            return NextResponse.json({ ok: false, error: 'Transaction not found' });
        }

        // Verify callback token
        if (transaction.callbackToken !== token) {
            await answerCallbackQuery(callbackId, '❌ Invalid or expired token');
            return NextResponse.json({ ok: false, error: 'Invalid token' });
        }

        // Check token expiry
        if (transaction.callbackTokenExpiry < new Date()) {
            await answerCallbackQuery(callbackId, '❌ Token expired');
            return NextResponse.json({ ok: false, error: 'Token expired' });
        }

        // Check if already processed
        if (transaction.status !== 'pending') {
            const statusText = transaction.status === 'approved' ? 'approved' : 'rejected';
            await answerCallbackQuery(callbackId, `ℹ️ Already ${statusText}`);
            await updateTelegramMessage(chatId, messageId, transaction, action);
            return NextResponse.json({ ok: true, message: `Already ${statusText}` });
        }

        // Process action
        if (action === 'appr') {
            await approveDeposit(transaction, fromUser.username || fromUser.first_name);
            await answerCallbackQuery(callbackId, '✅ Deposit approved!');
        } else if (action === 'rej') {
            await rejectDeposit(transaction, fromUser.username || fromUser.first_name);
            await answerCallbackQuery(callbackId, '❌ Deposit rejected');
        } else {
            await answerCallbackQuery(callbackId, '❌ Unknown action');
            return NextResponse.json({ ok: false, error: 'Unknown action' });
        }

        // Update Telegram message
        await updateTelegramMessage(chatId, messageId, transaction, action);

        return NextResponse.json({ ok: true, action });

    } catch (err) {
        console.error('Callback query handler error:', err);
        await answerCallbackQuery(callbackId, '❌ Error processing request');
        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 }
        );
    }
}

async function approveDeposit(transaction, adminUsername) {
    const session = await mongoose.startSession();
    session.startTransaction({
        readConcern: 'snapshot',
        writeConcern: 'majority'
    });

    try {
        console.log('Starting deposit approval transaction...');

        // 1. Update transaction
        transaction.status = 'approved';
        transaction.approvedBy = adminUsername;
        transaction.approvedAt = new Date();
        await transaction.save({ session });

        // 2. Credit user balance
        const user = await User.findById(transaction.user).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        const beforeBalance = user.balance;
        user.balance += transaction.amount;
        await user.save({ session });

        // 3. Update transaction balance fields
        transaction.beforeBalance = beforeBalance;
        transaction.afterBalance = user.balance;
        await transaction.save({ session });

        // 4. Add notification to user
        user.notifications.push({
            type: 'success',
            message: `✅ Deposit approved! ${(transaction.amount / 100).toFixed(2)} ETB has been added to your wallet. New balance: ${(user.balance / 100).toFixed(2)} ETB.`,
            read: false,
            createdAt: new Date()
        });
        await user.save({ session });

        // 5. Log admin action
        await AdminLog.create([{
            admin: transaction.user, // Placeholder, should be admin user ID
            action: 'approve_deposit',
            target: {
                type: 'Transaction',
                id: transaction._id
            },
            details: {
                amount: transaction.amount,
                approvedBy: adminUsername,
                newBalance: user.balance
            },
            timestamp: new Date(),
        }], { session });

        await session.commitTransaction();
        session.endSession();

        console.log('Deposit approved successfully:', {
            txId: transaction._id,
            amount: transaction.amount,
            newBalance: user.balance
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Approve deposit failed:', err);
        throw err;
    }
}

async function rejectDeposit(transaction, adminUsername) {
    const session = await mongoose.startSession();
    session.startTransaction({
        readConcern: 'snapshot',
        writeConcern: 'majority'
    });

    try {
        console.log('Starting deposit rejection transaction...');

        transaction.status = 'rejected';
        transaction.rejectedBy = adminUsername;
        transaction.rejectedAt = new Date();
        transaction.rejectionReason = 'Rejected via Telegram';
        await transaction.save({ session });

        // Add notification to user
        const user = await User.findById(transaction.user).session(session);
        if (user) {
            user.notifications.push({
                type: 'warning',
                message: `❌ Deposit rejected. Your deposit of ${(transaction.amount / 100).toFixed(2)} ETB was not approved. Please check your deposit details and try again or contact support.`,
                read: false,
                createdAt: new Date()
            });
            await user.save({ session });
        }

        await AdminLog.create([{
            admin: transaction.user, // Placeholder
            action: 'reject_deposit',
            target: {
                type: 'Transaction',
                id: transaction._id
            },
            details: {
                amount: transaction.amount,
                rejectedBy: adminUsername,
            },
            timestamp: new Date(),
        }], { session });

        await session.commitTransaction();
        session.endSession();

        console.log('Deposit rejected successfully:', { txId: transaction._id });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Reject deposit failed:', err);
        throw err;
    }
}

async function answerCallbackQuery(callbackId, text) {
    try {
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackId,
                text,
                show_alert: false,
            }),
        });
    } catch (err) {
        console.error('Answer callback query failed:', err);
    }
}

async function updateTelegramMessage(chatId, messageId, transaction, action) {
    try {
        const user = await User.findById(transaction.user);
        const status = transaction.status === 'approved' ? '✅ APPROVED' : '❌ REJECTED';
        const actionBy = transaction.approvedBy || transaction.rejectedBy || 'Unknown';

        const newText = `
💰 Deposit Request - ${status}

👤 User: ${user?.username || 'Unknown'} (${transaction.user})
💵 Amount: ${(transaction.amount / 100).toFixed(2)} ETB
📱 Phone: ${transaction.metadata?.phone || 'N/A'}
🔢 TxCode: ${transaction.metadata?.transactionCode || 'N/A'}
👤 Sender: ${transaction.metadata?.senderName || 'N/A'}
⏰ Processed: ${new Date().toLocaleString()}
🎗️ By: ${actionBy}

${transaction.status === 'approved' ? `💰 New Balance: ${(transaction.afterBalance / 100).toFixed(2)} ETB` : ''}
        `.trim();

        await fetch(`${TELEGRAM_API}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                text: newText,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }, // Remove buttons
            }),
        });
    } catch (err) {
        console.error('Update telegram message failed:', err);
    }
}
