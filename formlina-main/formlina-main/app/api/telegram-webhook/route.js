import { NextResponse } from "next/server";
import dbConnect from "../../../lib/dbConnect";
import Profile from "../../../models/Profile";
import Unlock from "../../../models/Unlock";
import fetch from "node-fetch";

export async function POST(request) {
  try {
    const update = await request.json();
    const chatId = update.callback_query?.message.chat.id;
    const callbackData = update.callback_query?.data;
    const callbackQueryId = update.callback_query?.id;

    if (!chatId || !callbackData) {
      console.log("Invalid callback:", update);
      return NextResponse.json({ success: true });
    }

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const answerCallbackUrl = `https://api.telegram.org/bot${telegramBotToken}/answerCallbackQuery`;

    if (callbackData.startsWith("approve_")) {
      const [_, profileId, userId] = callbackData.split("_");

      await dbConnect();

      const unlock = await Unlock.findOneAndUpdate(
        { profileId, userId, approved: false },
        { approved: true, rejected: false }, // Ensure rejected is false
        { new: true }
      );

      if (!unlock) {
        await fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `No pending unlock request found for profile ${profileId}`,
          }),
        });
        await fetch(answerCallbackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: callbackQueryId }),
        });
        return NextResponse.json({ success: true });
      }

      const profile = await Profile.findById(profileId);
      await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Profile ${profile?.name || profileId} approved for user ${userId}!`,
        }),
      });
      await fetch(answerCallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      });

      console.log("Profile approved:", { profileId, userId });
    } else if (callbackData.startsWith("reject_")) {
      const [_, profileId, userId] = callbackData.split("_");

      await dbConnect();
      const unlock = await Unlock.findOneAndUpdate(
        { profileId, userId, approved: false },
        { rejected: true }, // Mark as rejected instead of deleting
        { new: true }
      );

      if (unlock) {
        await fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `Unlock request for profile ${profileId} rejected`,
          }),
        });
      }
      await fetch(answerCallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      });

      console.log("Profile rejected:", { profileId, userId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}