/**
 * Telegram Bot Integration
 * Send admin notifications with inline action buttons
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

/**
 * Send photo with caption and inline keyboard to Telegram
 * @param {string} photoUrl - URL of the photo
 * @param {string} caption - Message caption
 * @param {Array} inlineKeyboard - Inline keyboard buttons
 * @returns {Promise<object>} Telegram API response
 */
async function sendPhoto(photoUrl, caption, inlineKeyboard = []) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
        console.warn('⚠️  Telegram not configured. Skipping notification.');
        return { ok: false, error: 'Telegram not configured' };
    }

    try {
        console.log(`📸 Sending photo to Telegram: ${photoUrl.substring(0, 50)}...`);
        const payload = {
            chat_id: TELEGRAM_ADMIN_CHAT_ID,
            photo: photoUrl,
            caption,
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard.length > 0 ? {
                inline_keyboard: inlineKeyboard,
            } : undefined,
        };

        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!data.ok) {
            console.error('❌ Telegram API error:', JSON.stringify(data, null, 2));
            console.error('Payload was:', JSON.stringify(payload, null, 2));

            // Fallback: Try sending as text if photo fails
            console.log('🔄 Attempting fallback to text message...');
            return sendMessage(
                `⚠️ <b>Image Upload Failed</b>\n\n${caption}\n\n🖼 <b>Image URL:</b> ${photoUrl}`,
                inlineKeyboard
            );
        }

        console.log('✅ Telegram photo sent successfully');
        return data;
    } catch (err) {
        console.error('❌ Telegram send error:', err);
        return { ok: false, error: err.message };
    }
}

/**
 * Send text message to Telegram
 * @param {string} text - Message text
 * @param {Array} inlineKeyboard - Optional inline keyboard
 * @returns {Promise<object>} Telegram API response
 */
async function sendMessage(text, inlineKeyboard = []) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
        console.warn('⚠️  Telegram not configured. Skipping notification.');
        return { ok: false, error: 'Telegram not configured' };
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_ADMIN_CHAT_ID,
                    text,
                    parse_mode: 'HTML',
                    reply_markup: inlineKeyboard.length > 0 ? {
                        inline_keyboard: inlineKeyboard,
                    } : undefined,
                }),
            }
        );

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API error:', data);
        }

        return data;
    } catch (err) {
        console.error('Telegram send error:', err);
        return { ok: false, error: err.message };
    }
}

/**
 * Send deposit notification to admin with approve/reject buttons
 * @param {object} transaction - Transaction document
 * @param {object} user - User document
 * @param {string} approveToken - Signed token for approve action
 * @param {string} rejectToken - Signed token for reject action
 * @returns {Promise<object>} Telegram API response
 */
export async function sendDepositNotification(transaction, user, approveToken, rejectToken) {
    const amount = (transaction.amount / 100).toFixed(2);
    // Prioritize root-level senderName, fallback to metadata
    const senderName = transaction.senderName || transaction.metadata?.senderName || 'Unknown';
    const txId = transaction._id.toString();
    const dateStr = new Date(transaction.createdAt).toLocaleString();

    // Required Format:
    // 🆕 New Deposit Request
    //
    // 👤 User: {username} ({email})
    // 💰 Amount: {amount} ETB
    // 🔢 Transaction ID: {transactionId}
    // 📤 Sender: {senderName}
    //
    // 📅 Date: {formattedDate}
    //
    // 🔗 [Open in Admin Dashboard](http://localhost:3000/admin/deposits/{transactionId})

    const caption = `
🆕 <b>New Deposit Request</b>

👤 <b>User:</b> ${user.username} (${user.email})
💰 <b>Amount:</b> ${amount} ETB
🔢 <b>Transaction ID:</b> ${txId}
📤 <b>Sender:</b> ${senderName}
🏦 <b>Method:</b> Bank Transfer

📅 <b>Date:</b> ${dateStr}

🔗 <a href="${APP_URL}/admin/deposits/${txId}">[Open Deposit]</a>

📸 <b>Screenshot:</b>
`.trim();

    // Inline keyboard with accept/reject buttons
    // Callback Data: accept:{depositId} reject:{depositId}
    const keyboard = [
        [
            {
                text: 'Accept Deposit',
                callback_data: `accept:${txId}`,
            },
            {
                text: 'Reject Deposit',
                callback_data: `reject:${txId}`,
            },
        ],
    ];

    return sendPhoto(transaction.cloudinaryUrl, caption, keyboard);
}

/**
 * Send video moderation notification
 * @param {object} video - Video document
 * @param {object} owner - Owner user document
 * @param {Array} flags - Moderation flags
 * @returns {Promise<object>} Telegram API response
 */
export async function sendModerationNotification(video, owner, flags = []) {
    const message = `
🎬 <b>Video Pending Moderation</b>

👤 <b>Uploader:</b> ${owner.username}
📹 <b>Title:</b> ${video.title}
🔢 <b>Video ID:</b> ${video._id}
⚠️ <b>Flags:</b> ${flags.join(', ') || 'None'}

🔗 <b>Review:</b> ${APP_URL}/admin/videos/${video._id}
  `.trim();

    const keyboard = [
        [
            {
                text: '✅ Approve',
                url: `${APP_URL}/admin/videos/${video._id}?action=approve`,
            },
            {
                text: '❌ Reject',
                url: `${APP_URL}/admin/videos/${video._id}?action=reject`,
            },
        ],
    ];

    if (video.thumbnailUrl) {
        return sendPhoto(video.thumbnailUrl, message, keyboard);
    } else {
        return sendMessage(message, keyboard);
    }
}

/**
 * Send confirmation message after admin action
 * @param {string} message - Confirmation message
 * @returns {Promise<object>} Telegram API response
 */
export async function sendConfirmation(message) {
    return sendMessage(`✅ ${message}`);
}

/**
 * Answer callback query (for inline button clicks)
 * @param {string} callbackQueryId - Callback query ID from Telegram
 * @param {string} text - Answer text
 * @param {boolean} showAlert - Show as alert vs toast
 * @returns {Promise<object>} Telegram API response
 */
export async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
    if (!TELEGRAM_BOT_TOKEN) {
        return { ok: false, error: 'Telegram not configured' };
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    callback_query_id: callbackQueryId,
                    text,
                    show_alert: showAlert,
                }),
            }
        );

        return response.json();
    } catch (err) {
        console.error('Telegram answer callback error:', err);
        return { ok: false, error: err.message };
    }
}

export default {
    sendPhoto,
    sendMessage,
    sendDepositNotification,
    sendModerationNotification,
    sendConfirmation,
    answerCallbackQuery,
};
