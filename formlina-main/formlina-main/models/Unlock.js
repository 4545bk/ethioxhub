import mongoose from "mongoose";

const UnlockSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  userId: { type: String, required: true },
  screenshotUrl: { type: String, required: true },
  approved: { type: Boolean, default: false },
  rejected: { type: Boolean, default: false }, // New field
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Unlock || mongoose.model("Unlock", UnlockSchema);