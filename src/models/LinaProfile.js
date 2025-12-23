import mongoose from 'mongoose';

const LinaProfileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 18 },
    country: { type: String, required: true },
    city: { type: String },
    neighborhood: { type: String },
    localSalary: { type: Boolean, default: false },
    intlSalary: { type: Boolean, default: false },
    photoUrl: { type: String, required: true }, // Cloudinary main photo
    additionalPhotos: [{ type: String }], // Cloudinary additional photos
    contactInfo: { type: String, required: true }, // Phone number
    telegramUsername: { type: String }, // Optional Telegram username (e.g., @username)
    voiceId: { type: String, default: 'voice1' }, // Audio instruction file
    isActive: { type: Boolean, default: true }, // Admin can hide profiles
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent Mongoose OverwriteModelError in development
if (process.env.NODE_ENV !== 'production' && mongoose.models && mongoose.models.LinaProfile) {
    delete mongoose.models.LinaProfile;
}

export default mongoose.models.LinaProfile || mongoose.model('LinaProfile', LinaProfileSchema);
