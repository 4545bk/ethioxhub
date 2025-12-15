/**
 * Create Video API
 * POST /api/videos/create
 * 
 * Creates a video record after successful Cloudinary upload
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import { requireAuth } from '@/lib/middleware';
import { createVideoSchema } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
    try {
        const user = await requireAuth(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate limiting (10 videos per day)
        const rateCheck = checkRateLimit(user._id.toString(), 'videos/create');

        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: 'Daily video upload limit reached. Please try again tomorrow.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateCheck.resetTime - Date.now()) / 1000).toString(),
                    },
                }
            );
        }

        // Parse and validate
        const body = await request.json();
        const validation = createVideoSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        const { title, description, tags, visibility, price, cloudinaryPublicId, thumbnailUrl } = validation.data;

        // Validate price for VIP videos
        if (visibility === 'vip' && (!price || price <= 0)) {
            return NextResponse.json(
                { error: 'Price is required for VIP videos' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Check for duplicate publicId
        const existing = await Video.findOne({ cloudinaryPublicId });
        if (existing) {
            return NextResponse.json(
                { error: 'Video with this Cloudinary ID already exists' },
                { status: 409 }
            );
        }

        // Create video
        const video = await Video.create({
            owner: user._id,
            title,
            description,
            tags: tags || [],
            visibility,
            price: price || 0,
            cloudinaryPublicId,
            thumbnailUrl,
            status: 'processing', // Will be updated by webhook
        });

        return NextResponse.json({
            success: true,
            message: 'Video created successfully. Processing will begin shortly.',
            video: {
                id: video._id,
                title: video.title,
                visibility: video.visibility,
                status: video.status,
            },
        }, { status: 201 });
    } catch (err) {
        console.error('Create video error:', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
