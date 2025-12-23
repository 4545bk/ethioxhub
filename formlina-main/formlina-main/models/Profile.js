import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true, min: 18 },
  country: { type: String, required: true },
  city: { type: String },
  neighborhood: { type: String },
  localSalary: { type: Boolean, default: false },
  intlSalary: { type: Boolean, default: false },
  photoUrl: { type: String, required: true },
  additionalPhotos: [{ type: String }],
  contactInfo: { type: String },
  isUnlocked: { type: Boolean, default: false },
  unlockedBy: { type: String },
  voiceId: { type: String }, // e.g., "voice1" maps to "/audio/voice1.mp3"
});

export default mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);