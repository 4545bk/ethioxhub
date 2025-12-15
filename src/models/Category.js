/**
 * Category Model
 * Categories for organizing videos
 */

import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            maxlength: [50, 'Name must be less than 50 characters'],
            index: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            maxlength: [500, 'Description must be less than 500 characters'],
        },
        enabled: {
            type: Boolean,
            default: true,
            index: true,
        },
        videoCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for enabled categories
CategorySchema.index({ enabled: 1, name: 1 });

// Pre-save hook to generate slug from name
CategorySchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Force delete cached model in development
if (process.env.NODE_ENV === 'development' && mongoose.models.Category) {
    delete mongoose.models.Category;
}

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

export default Category;
