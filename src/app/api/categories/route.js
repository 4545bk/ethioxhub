/**
 * Categories API
 * GET /api/categories
 * 
 * List all active categories
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const includeDisabled = searchParams.get('includeDisabled') === 'true';

        const query = includeDisabled ? {} : { enabled: true };

        const categories = await Category.find(query)
            .sort({ name: 1 })
            .select('name slug description videoCount enabled');

        return NextResponse.json({
            success: true,
            categories,
        });

    } catch (err) {
        console.error('List categories error:', err);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}
