import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "../../../lib/dbConnect";
import Profile from "../../../models/Profile";
import Unlock from "../../../models/Unlock";
import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const formData = await request.formData();
    const profileId = formData.get("profileId");
    const screenshot = formData.get("screenshot");

    if (!profileId || !screenshot) {
      return NextResponse.json(
        { success: false, error: "Missing profileId or screenshot" },
        { status: 400 }
      );
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "payment_screenshots" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    const screenshotUrl = uploadResult.secure_url;
    const userId = session.user.id;

    const unlock = new Unlock({
      profileId,
      userId,
      screenshotUrl,
    });
    await unlock.save();

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const message = `New payment screenshot for profile: ${profile.name}\nScreenshot: ${screenshotUrl}\nUser: ${session.user.email}`;
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "Approve", callback_data: `approve_${profileId}_${userId}` },
          { text: "Reject", callback_data: `reject_${profileId}_${userId}` },
        ],
      ],
    };

    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        reply_markup: inlineKeyboard,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message to Telegram");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlock error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}