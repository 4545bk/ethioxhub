/**
 * Videos List API with Advanced Filtering
 * GET /api/videos
 * 
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - category: categoryId or slug
 * - isPaid: boolean
 * - minPrice: number (cents)
 * - maxPrice: number (cents)
 * - minDuration: number (seconds)
 * - maxDuration: number (seconds)
 * - sort: newest | oldest | views | likes | trending
 * - search: text search in title/description
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Video from '@/models/Video';
import Category from '@/models/Category';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100);
        const skip = (page - 1) * limit;

        // Build query
        const query = { status: 'approved' };

        // Category filter
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            // Try to find category by ID, slug, or name
            const queryCriteria = [
                { slug: categoryParam },
                { slug: categoryParam.toLowerCase() },
                { name: categoryParam },
                { name: { $regex: new RegExp(`^${categoryParam}$`, 'i') } }
            ];

            // Only check _id if it's a valid ObjectId string
            if (categoryParam.match(/^[0-9a-fA-F]{24}$/)) {
                queryCriteria.push({ _id: categoryParam });
            }

            const category = await Category.findOne({
                $or: queryCriteria
            });
            if (category) {
                query.category = category._id;
            }
        }

        // Paid/Free filter
        const isPaid = searchParams.get('isPaid');
        if (isPaid !== null && isPaid !== '') {
            query.isPaid = isPaid === 'true';
        }

        // Price range
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }

        // Duration range
        const minDuration = searchParams.get('minDuration');
        const maxDuration = searchParams.get('maxDuration');
        if (minDuration || maxDuration) {
            query.duration = {};
            if (minDuration) query.duration.$gte = parseInt(minDuration);
            if (maxDuration) query.duration.$lte = parseInt(maxDuration);
        }

        // Text search
        const search = searchParams.get('search');
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Sort
        const sortParam = searchParams.get('sort') || 'newest';
        let sort = {};

        switch (sortParam) {
            case 'oldest':
                sort = { createdAt: 1 };
                break;
            case 'views':
                sort = { views: -1, createdAt: -1 };
                break;
            case 'likes':
                sort = { likesCount: -1, createdAt: -1 };
                break;
            case 'trending':
                // Trending = high engagement recently (views + likes weight)
                sort = { views: -1, likesCount: -1, createdAt: -1 };
                break;
            case 'premium':
                sort = { isPaid: -1, createdAt: -1 };
                break;
            case 'free':
                sort = { isPaid: 1, createdAt: -1 };
                break;
            case 'newest':
            default:
                sort = { createdAt: -1 };
                break;
        }

        // Execute query
        const [videos, total] = await Promise.all([
            Video.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('owner', 'username profilePicture')
                .populate('category', 'name slug')
                .select('-cloudinaryRawUrl -likedBy -dislikedBy'),
            Video.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            videos,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (err) {
        console.error('List videos error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch videos' },
            { status: 500 }
        );
    }
}
