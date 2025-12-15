/**
 * Telegram Callback Handler
 * Handles inline button clicks from Telegram
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();

        // Handle callback queries (button clicks)
        if (body.callback_query) {
            const callbackQuery = body.callback_query;
            const data = callbackQuery.data; // Format: "approve_TOKEN" or "reject_TOKEN"
            const chatId = callbackQuery.message.chat.id;

            if (data.startsWith('approve_') || data.startsWith('reject_')) {
                const [action, token] = data.split('_');
                const apiUrl = action === 'approve'
                    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/deposits/approve`
                    : `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/deposits/reject`;

                // Extract transaction ID from the message
                const messageText = callbackQuery.message.text;
                const txIdMatch = messageText.match(/Transaction ID: ([a-f0-9]+)/);
                const txId = txIdMatch ? txIdMatch[1] : null;

                if (!txId) {
                    // Answer callback query with error
                    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            callback_query_id: callbackQuery.id,
                            text: '❌ Could not find transaction ID',
                            show_alert: true,
                        }),
                    });
                    return NextResponse.json({ ok: true });
                }

                // Call the API endpoint
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        txId,
                        token,
                        adminNote: `Processed via Telegram by ${callbackQuery.from.first_name}`,
                    }),
                });

                const result = await response.json();

                // Answer the callback query
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: callbackQuery.id,
                        text: response.ok ? `✅ Deposit ${action}d successfully!` : `❌ Error: ${result.error}`,
                        show_alert: true,
                    }),
                });

                // Update the message to show it's been processed
                if (response.ok) {
                    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: callbackQuery.message.message_id,
                            text: `${callbackQuery.message.text}\n\n✅ ${action.toUpperCase()}ED by ${callbackQuery.from.first_name}`,
                        }),
                    });
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Telegram callback error:', err);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}
