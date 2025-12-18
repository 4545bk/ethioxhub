/**
 * Create Video API
 * POST /api/admin/videos/upload
 * 
 * Admin creates a new video entry after Cloudinary/S3 upload
 * FIXED: Category lookup to convert name/slug to ObjectId
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import Category from '@/models/Category';
import { requireAdmin } from '@/lib/middleware';
import { z } from 'zod';
import mongoose from 'mongoose';

const createVideoSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(2000).optional(),
    category: z.string().optional(), // Accept category name, slug, or ObjectId
    provider: z.enum(['cloudinary', 's3']).default('cloudinary'),
    // Cloudinary
    cloudinaryPublicId: z.string().optional(),
    cloudinaryUrl: z.string().url().optional(),
    // S3
    s3Key: z.string().optional(),
    s3Bucket: z.string().optional(),

    // Generic
    videoUrl: z.string().url().optional(), // For logic consistency if passed
    thumbnailUrl: z.string().url().optional(),
    isPaid: z.boolean().default(false),
    price: z.number().min(0).default(0),
    duration: z.number().optional(),
});

export async function POST(request) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json(authResult, { status: authResult.status });
        }

        const body = await request.json();
        console.log('Received video upload request:', { ...body, cloudinaryUrl: body.cloudinaryUrl ? '[REDACTED]' : undefined });

        const validation = createVideoSchema.safeParse(body);

        if (!validation.success) {
            console.error('Validation failed:', validation.error.flatten());
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if video already exists (by public ID or S3 key)
        if (body.provider === 'cloudinary' && body.cloudinaryPublicId) {
            const existing = await Video.findOne({ cloudinaryPublicId: body.cloudinaryPublicId });
            if (existing) return NextResponse.json({ error: 'Video already exists' }, { status: 409 });
        } else if (body.provider === 's3' && body.s3Key) {
            const existing = await Video.findOne({ s3Key: body.s3Key });
            if (existing) return NextResponse.json({ error: 'Video already exists' }, { status: 409 });
        }

        // CATEGORY LOOKUP: Convert category name/slug to ObjectId
        let categoryId = null;
        if (validation.data.category) {
            // Check if it's already a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(validation.data.category) && validation.data.category.length === 24) {
                categoryId = validation.data.category;
            } else {
                // Look up category by name or slug
                const category = await Category.findOne({
                    $or: [
                        { name: { $regex: new RegExp(`^${validation.data.category}$`, 'i') } },
                        { slug: validation.data.category.toLowerCase() }
                    ],
                    enabled: true
                });

                if (category) {
                    categoryId = category._id;
                    console.log(`Category "${validation.data.category}" found with ID: ${categoryId}`);
                } else {
                    // If category not found, use first available category as fallback
                    console.warn(`Category "${validation.data.category}" not found, using fallback category`);
                    const fallbackCategory = await Category.findOne({ enabled: true });
                    if (fallbackCategory) {
                        categoryId = fallbackCategory._id;
                        console.log(`Using fallback category: ${fallbackCategory.name} (${categoryId})`);
                    }
                }
            }
        }

        const videoData = {
            owner: authResult.user._id, // Admin owns the video
            title: validation.data.title,
            description: validation.data.description,
            category: categoryId, // Use looked-up ObjectId
            provider: validation.data.provider,
            cloudinaryPublicId: validation.data.cloudinaryPublicId,
            cloudinaryUrl: validation.data.cloudinaryUrl,
            s3Key: validation.data.s3Key,
            s3Bucket: validation.data.s3Bucket,
            videoUrl: validation.data.videoUrl,
            thumbnailUrl: validation.data.thumbnailUrl,
            isPaid: validation.data.isPaid,
            price: validation.data.isPaid ? validation.data.price * 100 : 0, // Convert to cents
            duration: validation.data.duration || 0,
            status: 'approved', // Admin uploads are auto-approved
        };

        // Ensure generic videoUrl is set if missing
        if (!videoData.videoUrl) {
            if (videoData.provider === 'cloudinary') {
                videoData.videoUrl = videoData.cloudinaryUrl;
            } else if (videoData.provider === 's3' && videoData.s3Key && !videoData.videoUrl) {
                const bucket = videoData.s3Bucket || 'ethioxhub';
                const region = process.env.AWS_REGION || 'eu-north-1';
                videoData.videoUrl = `https://${bucket}.s3.${region}.amazonaws.com/${videoData.s3Key}`;
            }
        }

        console.log('Creating video with data:', {
            provider: videoData.provider,
            s3Key: videoData.s3Key,
            s3Bucket: videoData.s3Bucket,
            hasVideoUrl: !!videoData.videoUrl,
            categoryId: categoryId
        });

        const video = await Video.create(videoData);

        // Update category video count
        if (categoryId) {
            await Category.findByIdAndUpdate(categoryId, {
                $inc: { videoCount: 1 }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Video created successfully',
            video,
        });

    } catch (err) {
        console.error('Create video error:', err);
        console.error('Error details:', {
            name: err.name,
            message: err.message,
            code: err.code,
            ...(err.errors && { validationErrors: err.errors })
        });

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: err.message,
                ...(process.env.NODE_ENV === 'development' && { details: err.toString() })
            },
            { status: 500 }
        );
    }
}
