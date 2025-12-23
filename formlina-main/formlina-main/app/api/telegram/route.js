import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Unlock from "../../../models/Unlock";

export async function POST(request) {
  try {
    await dbConnect();
    const update = await request.json();

    if (!update.callback_query) {
      return NextResponse.json({ success: true });
    }

    const chatId = update.callback_query.message.chat.id;
    const data = update.callback_query.data;
    const callbackQueryId = update.callback_query.id;

    console.log("Webhook received:", { chatId, data }); // Debug log

    const [action, profileId, userId] = data.split("_");

    if (action === "approve") {
      const unlock = await Unlock.findOne({ profileId, userId });
      if (!unlock) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Unlock request not found.",
          }),
        });
        return NextResponse.json({ success: true });
      }

      unlock.approved = true;
      await unlock.save();

      console.log("Unlock approved:", { profileId, userId }); // Debug log

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Profile unlock approved for user ${userId}!`,
        }),
      });

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: "Approved!",
        }),
      });
    } else if (action === "reject") {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Profile unlock request rejected for user ${userId}.`,
        }),
      });
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: "Rejected",
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}