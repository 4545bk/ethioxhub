// bot.js
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" }); // Explicitly load .env.local

// Debug: Log env vars to confirm
console.log("TELEGRAM_BOT_TOKEN:", process.env.TELEGRAM_BOT_TOKEN);
console.log("TELEGRAM_CHAT_ID:", process.env.TELEGRAM_CHAT_ID);
console.log("MONGODB_URI:", process.env.MONGODB_URI);

const dbConnect = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB connected in bot.js");
};

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 18 },
  country: { type: String, required: true },
  city: { type: String },
  neighborhood: { type: String },
  localSalary: { type: Boolean, default: false },
  intlSalary: { type: Boolean, default: false },
  photoUrl: { type: String, required: true },
  contactInfo: { type: String },
  isUnlocked: { type: Boolean, default: false },
  unlockedBy: { type: String },
});
const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  console.log("Callback received:", data);

  if (data.startsWith("approve_")) {
    const profileId = data.split("_")[1];

    try {
      await dbConnect();
      const profile = await Profile.findByIdAndUpdate(
        profileId,
        { isUnlocked: true },
        { new: true, runValidators: false }
      );

      if (!profile) {
        await bot.sendMessage(chatId, `Profile ${profileId} not found`);
        return;
      }

      await bot.sendMessage(chatId, `Profile ${profileId} approved!`);
      await bot.answerCallbackQuery(callbackQuery.id);
      console.log("Profile approved:", profileId);
    } catch (error) {
      console.error("Telegram approval error:", error);
      await bot.sendMessage(chatId, `Error approving profile ${profileId}: ${error.message}`);
    }
  }
});

console.log("Telegram bot is running...");