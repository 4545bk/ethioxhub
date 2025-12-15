/**
 * Admin Categories API
 * POST /api/admin/categories - Create category
 * PUT /api/admin/categories - Update category
 * DELETE /api/admin/categories - Delete category
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import { requireAdmin } from '@/lib/middleware';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(500).optional(),
    enabled: z.boolean().optional(),
});

export async function POST(request) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json(authResult, { status: authResult.status });
        }

        const body = await request.json();
        const validation = categorySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        await connectDB();

        const category = await Category.create(validation.data);

        return NextResponse.json({
            success: true,
            category,
        });

    } catch (err) {
        console.error('Create category error:', err);
        if (err.code === 11000) {
            return NextResponse.json(
                { error: 'Category with this name already exists' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json(authResult, { status: authResult.status });
        }

        const body = await request.json();
        const { _id, ...updateData } = body;

        if (!_id) {
            return NextResponse.json(
                { error: 'Category ID required' },
                { status: 400 }
            );
        }

        const validation = categorySchema.partial().safeParse(updateData);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten() },
                { status: 400 }
            );
        }

        await connectDB();

        const category = await Category.findByIdAndUpdate(
            _id,
            validation.data,
            { new: true, runValidators: true }
        );

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            category,
        });

    } catch (err) {
        console.error('Update category error:', err);
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const authResult = await requireAdmin(request);
        if (authResult.error) {
            return NextResponse.json(authResult, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('id');

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Category ID required' },
                { status: 400 }
            );
        }

        await connectDB();

        const category = await Category.findByIdAndDelete(categoryId);

        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Category deleted',
        });

    } catch (err) {
        console.error('Delete category error:', err);
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        );
    }
}
