/**
 * Admin Edit Video API
 * PUT /api/admin/videos/[id]/edit
 * Allows admin to update video details
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import Category from '@/models/Category';
import { requireAdmin } from '@/lib/middleware';

export async function PUT(request, { params }) {
    try {
        await connectDB();

        // Verify admin
        const admin = await requireAdmin(request);
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Find video
        const video = await Video.findById(params.id);
        if (!video) {
            return NextResponse.json({ error: 'Video not found' }, { status: 404 });
        }

        // Parse request body
        const body = await request.json();
        const { title, description, category, tags, isPaid, price, thumbnailUrl } = body;

        // Validation
        if (title && title.trim().length === 0) {
            return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
        }

        if (title && title.length > 200) {
            return NextResponse.json({ error: 'Title must be less than 200 characters' }, { status: 400 });
        }

        if (description && description.length > 2000) {
            return NextResponse.json({ error: 'Description must be less than 2000 characters' }, { status: 400 });
        }

        if (tags && tags.length > 10) {
            return NextResponse.json({ error: 'Maximum 10 tags allowed' }, { status: 400 });
        }

        if (price !== undefined && price < 0) {
            return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
        }

        // Update fields
        if (title !== undefined) video.title = title.trim();
        if (description !== undefined) video.description = description.trim();
        if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;

        // Handle category update
        if (category !== undefined && category !== null) {
            // Check if category exists
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
            }
            video.category = category;
        }

        if (tags !== undefined) {
            // Clean and filter tags
            video.tags = tags
                .filter(tag => tag && tag.trim().length > 0)
                .map(tag => tag.trim().toLowerCase());
        }

        if (isPaid !== undefined) {
            video.isPaid = Boolean(isPaid);
            // If switching to free, set price to 0
            if (!isPaid) {
                video.price = 0;
            }
        }

        if (price !== undefined && video.isPaid) {
            // Store price in cents
            video.price = Math.round(price * 100);
        }

        // Save updates
        await video.save();

        // Populate for response
        await video.populate('category', 'name slug');
        await video.populate('owner', 'username email');

        return NextResponse.json({
            success: true,
            message: 'Video updated successfully',
            video: video.toObject()
        });

    } catch (error) {
        console.error('Edit video error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update video' },
            { status: 500 }
        );
    }
}
